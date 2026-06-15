import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const API_KEY_PREFIX = 'vl_';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  // 11.1.2 — Create API key (return plaintext only once)
  async createApiKey(userId: string, name: string, scopes: string[] = ['sms:send', 'calls:read']) {
    const rawKey = API_KEY_PREFIX + crypto.randomBytes(32).toString('hex');
    const keyHash = await bcrypt.hash(rawKey, 12);
    const keyPrefix = rawKey.substring(0, 8);

    const apiKey = await this.prisma.apiKey.create({
      data: { userId, name, keyPrefix, keyHash, scopes },
    });

    return { ...apiKey, rawKey }; // Return raw key ONLY on creation
  }

  // 11.1.3 — List keys (never show hash)
  async listApiKeys(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return keys;
  }

  // 11.1.4 — Revoke key
  async revokeApiKey(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });
    if (!key) throw new NotFoundException({ code: 'NOT_FOUND', message: 'API key not found' });

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    return { message: 'API key revoked' };
  }
}
