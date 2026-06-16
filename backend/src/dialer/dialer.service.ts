import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CsvValidator } from './csv-validator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import axios, { AxiosInstance } from 'axios';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DialerService {
  private readonly logger = new Logger(DialerService.name);
  private readonly httpClient: AxiosInstance;
  private readonly dialerServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvValidator: CsvValidator,
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService,
  ) {
    this.dialerServiceUrl =
      configService.get<string>('app.dialerServiceUrl') || 'http://localhost:8080';
    this.internalApiKey =
      configService.get<string>('app.internalApiKey') || 'change-me';

    this.httpClient = axios.create({
      baseURL: this.dialerServiceUrl,
      timeout: 30_000,
      headers: {
        Authorization: `Bearer ${this.internalApiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // 8.1.2 — Create campaign (does NOT start it yet)
  async createCampaign(
    userId: string,
    dto: CreateCampaignDto,
    csvBuffer: Buffer,
  ) {
    // Pre-validate CSV
    const dncEntries = await this.prisma.dncEntry.findMany({
      where: { userId },
      select: { phone: true },
    });
    const dncPhones = new Set(dncEntries.map((d) => d.phone));
    const validationReport = this.csvValidator.validate(csvBuffer, dncPhones);

    // Create campaign record
    const campaign = await this.prisma.campaign.create({
      data: {
        userId,
        name: dto.name,
        fromNumber: dto.fromNumber,
        concurrency: dto.concurrency || 1,
        delaySeconds: dto.delaySeconds || 0,
        retryMax: dto.retryMax || 0,
        voicemailDropUrl: dto.voicemailDropUrl,
        callingHoursStart: dto.callingHoursStart,
        callingHoursEnd: dto.callingHoursEnd,
        callingHoursTimezone: dto.callingHoursTimezone,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        totalContacts: validationReport.valid,
      },
    });

    // 8.1.2 — Bulk insert campaign_contacts from CSV
    const csvString = csvBuffer.toString('utf-8');
    const { parse } = require('csv-parse/sync');
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const header = Object.keys(records[0] || {});
    const phoneCol = header.find((h: string) =>
      ['phone', 'phonenumber', 'number', 'mobile', 'tel'].includes(
        h.toLowerCase(),
      ),
    ) || 'phone';
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    const contacts = records
      .filter((r: Record<string, string>) => {
        const phone = r[phoneCol]?.trim();
        return phone && e164Regex.test(phone) && !dncPhones.has(phone);
      })
      .map((r: Record<string, string>) => ({
        campaignId: campaign.id,
        phone: r[phoneCol].trim(),
        name: r.name || null,
        notes: r.notes || null,
      }));

    if (contacts.length > 0) {
      await this.prisma.campaignContact.createMany({ data: contacts });
    }

    return { campaign, validationReport };
  }

  // 8.1.3 — List campaigns
  async listCampaigns(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where: { userId } }),
    ]);
    return { data, meta: { page, limit, total } };
  }

  // 8.1.4 — Get campaign detail
  async getCampaign(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, userId },
    });
    if (!campaign) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Campaign not found' });
    return campaign;
  }

  // 8.1.5 — Start campaign (forward to Go service)
  async startCampaign(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, userId },
    });
    if (!campaign) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Campaign not found' });

    // Verify from_number is active and owned by user
    const ownNumber = await this.prisma.phoneNumber.findFirst({
      where: { number: campaign.fromNumber, userId, status: 'active' },
    });
    if (!ownNumber) {
      throw new BadRequestException({
        code: 'NUMBER_NOT_OWNED',
        message: `You do not own the number ${campaign.fromNumber} or it is not active`,
      });
    }

    // Check plan permission
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (!subscription?.plan?.powerDialerEnabled) {
      throw new BadRequestException({
        code: 'PLAN_LIMIT_EXCEEDED',
        message: 'Power dialer not available on your plan',
      });
    }

    // Send to Go dialer service
    const contacts = await this.prisma.campaignContact.findMany({
      where: { campaignId, status: 'pending' },
      select: { phone: true, name: true, notes: true },
    });

    const payload = {
      campaignId: campaign.id,
      name: campaign.name,
      userId,
      fromNumber: campaign.fromNumber,
      concurrency: campaign.concurrency,
      delaySeconds: campaign.delaySeconds,
      retryMax: campaign.retryMax,
      voicemailDropUrl: campaign.voicemailDropUrl,
      callingHoursStart: campaign.callingHoursStart,
      callingHoursEnd: campaign.callingHoursEnd,
      callingHoursTimezone: campaign.callingHoursTimezone,
      contacts,
    };

    await this.httpClient.post('/campaigns', payload);

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'running', startedAt: new Date() },
    });

    return { status: 'running' };
  }

  // 8.1.6 — Pause campaign
  async pauseCampaign(userId: string, campaignId: string) {
    await this.verifyOwnership(userId, campaignId);
    await this.httpClient.post(`/campaigns/${campaignId}/pause`);
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'paused', pausedAt: new Date() },
    });
    return { status: 'paused' };
  }

  // 8.1.7 — Resume campaign
  async resumeCampaign(userId: string, campaignId: string) {
    await this.verifyOwnership(userId, campaignId);
    await this.httpClient.post(`/campaigns/${campaignId}/resume`);
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'running' },
    });
    return { status: 'running' };
  }

  // 8.1.8 — Stop campaign
  async stopCampaign(userId: string, campaignId: string) {
    await this.verifyOwnership(userId, campaignId);
    await this.httpClient.post(`/campaigns/${campaignId}/stop`);
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'stopped', completedAt: new Date() },
    });
    return { status: 'stopped' };
  }

  // 8.1.9 — Export campaign results
  async exportCampaignResults(userId: string, campaignId: string) {
    await this.verifyOwnership(userId, campaignId);
    const contacts = await this.prisma.campaignContact.findMany({
      where: { campaignId },
    });

    const header = 'phone,name,notes,status,attempts,call_duration,last_attempted_at\n';
    const rows = contacts.map((c) =>
      [c.phone, c.name || '', c.notes || '', c.status, c.attempts, c.callDuration || '', c.lastAttemptedAt?.toISOString() || ''].join(','),
    ).join('\n');

    return Buffer.from(header + rows, 'utf-8');
  }

  // 8.1.10 — Handle progress callback from Go service
  async handleProgressCallback(
    campaignId: string,
    progress: {
      dialed: number;
      answered: number;
      failed: number;
      busy: number;
      noAnswer: number;
      remaining: number;
    },
  ) {
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        dialed: progress.dialed,
        answered: progress.answered,
        failed: progress.failed,
        busy: progress.busy,
        noAnswer: progress.noAnswer,
      },
    });

    // Emit WebSocket event
    this.eventEmitter.emit('campaign:progress', {
      campaignId,
      ...progress,
    });

    // Check if complete
    if (progress.remaining === 0) {
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'completed', completedAt: new Date() },
      });
      this.eventEmitter.emit('campaign:complete', {
        campaignId,
        summary: progress,
      });
    }

    return { success: true };
  }

  // 8.1.11 — Get campaign results (paginated)
  async getCampaignResults(
    userId: string,
    campaignId: string,
    page = 1,
    limit = 50,
  ) {
    await this.verifyOwnership(userId, campaignId);
    const [data, total] = await Promise.all([
      this.prisma.campaignContact.findMany({
        where: { campaignId },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaignContact.count({ where: { campaignId } }),
    ]);
    return { data, meta: { page, limit, total } };
  }

  // --- DNC Management (8.6) ---
  async addDnc(userId: string, phone: string) {
    return this.prisma.dncEntry.create({
      data: { userId, phone, source: 'manual' },
    });
  }

  async listDnc(userId: string, page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.dncEntry.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dncEntry.count({ where: { userId } }),
    ]);
    return { data, meta: { page, limit, total } };
  }

  async removeDnc(userId: string, dncId: string) {
    const entry = await this.prisma.dncEntry.findFirst({
      where: { id: dncId, userId },
    });
    if (!entry) throw new NotFoundException({ code: 'NOT_FOUND', message: 'DNC entry not found' });
    await this.prisma.dncEntry.delete({ where: { id: dncId } });
    return { message: 'DNC entry removed' };
  }

  // --- Helpers ---
  private async verifyOwnership(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, userId },
    });
    if (!campaign) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Campaign not found',
      });
    }
    return campaign;
  }
}
