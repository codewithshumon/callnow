import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { TelephonyProvider } from '../telephony/interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../telephony/telephony.module';
import { NumbersService } from '../numbers/numbers.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SendMessageDto } from './dto/send-message.dto';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TELEPHONY_PROVIDER)
    private readonly telephonyProvider: TelephonyProvider,
    private readonly numbersService: NumbersService,
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService,
  ) {
    this.redis = new Redis(
      configService.get<string>('redis.url') || 'redis://localhost:6379',
    );
  }

  // 5.1.2 — Get conversations (paginated)
  async getConversations(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId },
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where: { userId } }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  // 5.1.3 — Get messages in a conversation
  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  // 5.1.4 — Send SMS
  async sendMessage(userId: string, dto: SendMessageDto) {
    // Verify ownership of from-number (FR-MSG-01)
    const ownNumber = await this.prisma.phoneNumber.findFirst({
      where: { number: dto.fromNumber, userId, status: 'active' },
    });

    if (!ownNumber) {
      throw new BadRequestException({
        code: 'NUMBER_NOT_OWNED',
        message: 'You do not own the from-number',
      });
    }

    // Check SMS quota via Redis counters (simplified)
    const quotaKey = `usage:${userId}:sms`;
    const count = await this.redis.get(quotaKey);
    if (count && parseInt(count, 10) >= 2000) {
      throw new BadRequestException({
        code: 'PLAN_LIMIT_EXCEEDED',
        message: 'SMS quota exceeded',
      });
    }

    // If scheduled, just store and return
    if (dto.scheduledAt) {
      const conversation = await this.findOrCreateConversation(
        userId,
        dto.fromNumber,
        dto.toNumber,
      );

      const message = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          provider: this.telephonyProvider.name,
          direction: 'outbound',
          body: dto.body,
          mediaUrls: dto.mediaUrls || [],
          status: 'queued',
          scheduledAt: new Date(dto.scheduledAt),
        },
      });

      return message;
    }

    // Send via provider
    const result = await this.telephonyProvider.sendMessage({
      from: dto.fromNumber,
      to: dto.toNumber,
      body: dto.body,
      mediaUrls: dto.mediaUrls,
    });

    const conversation = await this.findOrCreateConversation(
      userId,
      dto.fromNumber,
      dto.toNumber,
    );

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        providerSid: result.providerSid,
        provider: this.telephonyProvider.name,
        direction: 'outbound',
        body: dto.body,
        mediaUrls: dto.mediaUrls || [],
        status: 'queued',
      },
    });

    // Update conversation last_message_at
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Increment SMS quota counter
    await this.redis.incr(quotaKey);
    await this.redis.expire(quotaKey, 30 * 24 * 60 * 60); // monthly

    // Emit WebSocket event
    this.eventEmitter.emit('message:new', { userId, message });

    return message;
  }

  // 5.1.5 — Soft-delete a message
  async deleteMessage(messageId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { userId },
      include: {
        messages: { where: { id: messageId }, take: 1 },
      },
    });

    if (!conversation || conversation.messages.length === 0) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Message not found',
      });
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { body: null, status: 'deleted' },
    });

    return { message: 'Message deleted' };
  }

  // 5.1.6 — Send group message
  async sendGroupMessage(
    userId: string,
    dto: SendMessageDto & { toNumbers: string[] },
  ) {
    if (!dto.toNumbers || dto.toNumbers.length > 10) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'toNumbers must contain 1-10 numbers',
      });
    }

    const results: Awaited<ReturnType<typeof this.sendMessage>>[] = [];
    for (const toNumber of dto.toNumbers) {
      const result = await this.sendMessage(userId, {
        ...dto,
        toNumber,
      });
      results.push(result);
    }

    return results;
  }

  // 5.1.7 — Search conversations
  async searchConversations(userId: string, query: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        userId,
        OR: [
          { contactName: { contains: query, mode: 'insensitive' } },
          { toNumber: { contains: query } },
        ],
      },
      take: 20,
    });

    return conversations;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async findOrCreateConversation(
    userId: string,
    fromNumber: string,
    toNumber: string,
  ) {
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        userId_fromNumber_toNumber: {
          userId,
          fromNumber,
          toNumber,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { userId, fromNumber, toNumber },
      });
    }

    return conversation;
  }
}
