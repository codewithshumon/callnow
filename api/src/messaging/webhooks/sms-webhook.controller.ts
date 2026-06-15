import {
  Controller,
  Post,
  Param,
  Req,
  UseGuards,
  Inject,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { WebhookSignatureGuard } from '../../telephony/guards/webhook-signature.guard';
import type { TelephonyProvider } from '../../telephony/interfaces/telephony-provider.interface';
import type { RawWebhookRequest } from '../../telephony/interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../../telephony/telephony.module';
import { PrismaService } from '../../prisma/prisma.service';
import { NumbersService } from '../../numbers/numbers.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * SMS/MMS webhook controller — handles inbound messages and status callbacks.
 *
 * Routes: POST /webhooks/:provider/sms
 *         POST /webhooks/:provider/sms/status
 *
 * Ref: SDD §3.4, PAL §5, URD UC-03
 */
@Controller('webhooks')
export class SmsWebhookController {
  private readonly logger = new Logger(SmsWebhookController.name);

  constructor(
    @Inject(TELEPHONY_PROVIDER)
    private readonly telephonyProvider: TelephonyProvider,
    private readonly prisma: PrismaService,
    private readonly numbersService: NumbersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // 5.2.2 — Inbound SMS
  @Post(':provider/sms')
  @UseGuards(WebhookSignatureGuard)
  async handleInboundSms(
    @Param('provider') _providerName: string,
    @Req() req: Request,
  ) {
    const rawReq: RawWebhookRequest = {
      body: req.body as Record<string, unknown>,
      headers: req.headers as Record<string, string | string[] | undefined>,
      rawBody: (req as unknown as { rawBody?: Buffer }).rawBody,
    };

    const normalized =
      this.telephonyProvider.parseInboundMessageWebhook(rawReq);

    // Lookup owner by the "to" number (recipient)
    const ownerId = await this.numbersService.getUserByNumber(normalized.to);

    if (!ownerId) {
      this.logger.warn(`Inbound SMS to unowned number: ${normalized.to}`);
      // Return empty response — provider won't retry
      return this.telephonyProvider.generateCallControlResponse({
        type: 'empty',
      });
    }

    // Find or create conversation
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        userId_fromNumber_toNumber: {
          userId: ownerId,
          fromNumber: normalized.to, // user's number
          toNumber: normalized.from, // sender
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          userId: ownerId,
          fromNumber: normalized.to,
          toNumber: normalized.from,
        },
      });
    }

    // Store message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        providerSid: normalized.providerMessageSid,
        provider: this.telephonyProvider.name,
        direction: 'inbound',
        body: normalized.body,
        mediaUrls: normalized.mediaUrls,
        status: 'delivered',
      },
    });

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    // Emit WebSocket event
    this.eventEmitter.emit('message:new', { userId: ownerId, message });

    // 8.6.5 — Auto-add to DNC on campaign opt-out (STOP/UNSUBSCRIBE)
    const upperBody = normalized.body.toUpperCase().trim();
    if (
      upperBody === 'STOP' ||
      upperBody === 'UNSUBSCRIBE' ||
      upperBody === 'CANCEL' ||
      upperBody === 'END' ||
      upperBody === 'QUIT'
    ) {
      try {
        await this.prisma.dncEntry.upsert({
          where: {
            userId_phone: { userId: ownerId, phone: normalized.from },
          },
          create: {
            userId: ownerId,
            phone: normalized.from,
            source: 'campaign_opt_out',
            reason: `Opted out via SMS: ${normalized.body}`,
          },
          update: {
            source: 'campaign_opt_out',
          },
        });
        this.logger.log(
          `Auto-DNC: ${normalized.from} for user ${ownerId} via campaign opt-out`,
        );
      } catch (error) {
        this.logger.error('Failed to auto-add DNC entry', error);
      }
    }

    return this.telephonyProvider.generateCallControlResponse({
      type: 'empty',
    });
  }

  // 5.2.3 — SMS Status Callback
  @Post(':provider/sms/status')
  @UseGuards(WebhookSignatureGuard)
  async handleSmsStatus(
    @Param('provider') _providerName: string,
    @Req() req: Request,
  ) {
    const rawReq: RawWebhookRequest = {
      body: req.body as Record<string, unknown>,
      headers: req.headers as Record<string, string | string[] | undefined>,
    };

    const normalized = this.telephonyProvider.parseStatusCallback(rawReq);

    // Find message by provider SID
    const message = await this.prisma.message.findFirst({
      where: { providerSid: normalized.providerSid },
      include: { conversation: { select: { userId: true } } },
    });

    if (!message) {
      this.logger.warn(
        `Status callback for unknown message: ${normalized.providerSid}`,
      );
      return { success: true };
    }

    // Update status
    await this.prisma.message.update({
      where: { id: message.id },
      data: { status: normalized.status },
    });

    // Emit WebSocket event
    this.eventEmitter.emit('message:status', {
      userId: message.conversation.userId,
      messageId: message.id,
      status: normalized.status,
    });

    return { success: true };
  }
}
