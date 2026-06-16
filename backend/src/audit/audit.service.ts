import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  // 12.1.2 — Fire-and-forget insert
  async log(
    action: string,
    userId: string | null,
    resourceType: string,
    resourceId: string | null,
    details: Record<string, unknown> = {},
    ip?: string,
    userAgent?: string,
  ) {
    // Fire-and-forget: don't await
    this.prisma.auditLog
      .create({
        data: {
          userId,
          action,
          resourceType,
          resourceId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: details as any,
          ipAddress: ip || null,
          userAgent: userAgent || null,
        },
      })
      .catch((err) => {
        // Silently fail — audit log is non-critical
        console.error('Audit log insert failed:', err.message);
      });
  }

  // 12.1.4 — Admin endpoint: query audit logs
  async query(params: {
    userId?: string;
    action?: string;
    resourceType?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = params.action;
    if (params.resourceType) where.resourceType = params.resourceType;

    const page = params.page || 1;
    const limit = params.limit || 50;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }
}
