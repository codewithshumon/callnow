import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 13.1.4 — Runs daily: enforce data retention policies.
 */
@Injectable()
export class DataRetentionJob {
  private readonly logger = new Logger(DataRetentionJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 4 * * *') // 4 AM daily
  async run() {
    const now = new Date();

    // Messages: purge older than 2 years
    const msgResult = await this.prisma.message.deleteMany({
      where: { createdAt: { lt: new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()) } },
    });
    this.logger.log(`Purged ${msgResult.count} messages`);

    // Voicemails: purge older than 90 days (standard)
    const vmResult = await this.prisma.voicemail.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    });
    this.logger.log(`Purged ${vmResult.count} voicemails`);

    // Password reset tokens: purge older than 24h
    await this.prisma.passwordResetToken.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    // OTP codes: purge older than 5 min
    await this.prisma.otpCode.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
    });
  }
}
