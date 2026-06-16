import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  usageRecord: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  subscription: { findUnique: jest.fn(), upsert: jest.fn() },
  invoice: { findMany: jest.fn(), findFirst: jest.fn() },
  plan: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
};

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<BillingService>(BillingService);
  });

  it('should return usage with plan limits', async () => {
    mockPrisma.usageRecord.findUnique.mockResolvedValue({
      minutesUsed: 100, smsSent: 50, mmsSent: 0, numbersHeld: 1, smsReceived: 10, mmsReceived: 0,
    });
    mockPrisma.subscription.findUnique.mockResolvedValue({
      plan: { name: 'Pro', includedMinutes: 1000, includedSms: 2000, includedMms: 100, maxNumbers: 5 },
    });

    const result = await service.getCurrentUsage('u1');
    expect(result.plan).toBe('Pro');
    expect(result.usage.minutesIncluded).toBe(1000);
    expect(result.usage.smsUsed).toBe(50);
  });

  it('should upgrade plan', async () => {
    mockPrisma.plan.findUnique.mockResolvedValue({ id: 'plan2', name: 'Pro' });
    mockPrisma.subscription.upsert.mockResolvedValue({});
    const result = await service.upgradePlan('u1', 'plan2');
    expect(result.message).toContain('Pro');
  });
});
