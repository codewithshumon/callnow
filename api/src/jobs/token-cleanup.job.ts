import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 13.1.5 — Runs daily: delete expired tokens.
 */
@Injectable()
export class TokenCleanupJob {
  private readonly logger = new Logger(TokenCleanupJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * *') // 3 AM daily
  async run() {
    // Delete expired refresh tokens
    const rt = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Cleaned ${rt.count} expired refresh tokens`);

    // Delete expired email verification tokens
    const ev = await this.prisma.emailVerificationToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Cleaned ${ev.count} expired email verification tokens`);
  }
}
