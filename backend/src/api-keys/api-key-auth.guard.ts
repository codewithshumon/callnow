import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const API_KEY_PREFIX = 'vl_';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Missing API key' });
    }

    const rawKey = authHeader.replace('Bearer ', '');
    if (!rawKey.startsWith(API_KEY_PREFIX)) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid API key format' });
    }

    const keyPrefix = rawKey.substring(0, 8);

    // Find by prefix first (narrow candidates)
    const keys = await this.prisma.apiKey.findMany({
      where: { keyPrefix, revokedAt: null },
    });

    let matchedKey: { userId: string; scopes: string[]; expiresAt: Date | null } | null = null;

    for (const key of keys) {
      if (key.expiresAt && key.expiresAt < new Date()) continue;
      const match = await bcrypt.compare(rawKey, key.keyHash);
      if (match) {
        matchedKey = { userId: key.userId, scopes: key.scopes, expiresAt: key.expiresAt };
        break;
      }
    }

    if (!matchedKey) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid API key' });
    }

    // Attach user + scopes to request
    request.user = { id: matchedKey.userId, scopes: matchedKey.scopes, authType: 'api-key' };
    return true;
  }
}
