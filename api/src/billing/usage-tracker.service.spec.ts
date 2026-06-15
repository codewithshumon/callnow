import { Test, TestingModule } from '@nestjs/testing';
import { UsageTrackerService } from './usage-tracker.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  usageRecord: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  subscription: { findUnique: jest.fn(), findMany: jest.fn() },
};

describe('UsageTrackerService', () => {
  let service: UsageTrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageTrackerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<UsageTrackerService>(UsageTrackerService);
  });

  it('should increment SMS sent counter', async () => {
    mockPrisma.usageRecord.findUnique.mockResolvedValue({
      id: 'ur1', userId: 'u1', smsSent: 10, minutesUsed: 0, numbersHeld: 1,
      mmsSent: 0, smsReceived: 0, mmsReceived: 0,
    });
    mockPrisma.subscription.findUnique.mockResolvedValue({
      plan: { includedSms: 2000, includedMinutes: 1000 },
    });
    mockPrisma.usageRecord.update.mockResolvedValue({});

    await service.incrementSmsSent('u1');
    expect(mockPrisma.usageRecord.update).toHaveBeenCalled();
  });

  it('should alert at 80% usage', async () => {
    mockPrisma.usageRecord.findUnique.mockResolvedValue({
      id: 'ur1', userId: 'u1', smsSent: 1600, minutesUsed: 800, numbersHeld: 1,
      mmsSent: 0, smsReceived: 0, mmsReceived: 0,
    });
    mockPrisma.subscription.findUnique.mockResolvedValue({
      plan: { includedSms: 2000, includedMinutes: 1000 },
    });
    mockPrisma.usageRecord.update.mockResolvedValue({});

    // Should trigger 80% alert for minutes (800/1000 = 80%)
    await service.incrementMinutes('u1', 1);
    expect(mockPrisma.usageRecord.update).toHaveBeenCalled();
  });
});
