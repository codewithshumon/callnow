import { Test, TestingModule } from '@nestjs/testing';
import { DialerService } from './dialer.service';
import { PrismaService } from '../prisma/prisma.service';
import { CsvValidator } from './csv-validator';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

const mockPrisma = {
  campaign: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
  campaignContact: { findMany: jest.fn(), count: jest.fn() },
  dncEntry: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
  subscription: { findUnique: jest.fn() },
};
const mockEventEmitter = { emit: jest.fn() };
const mockConfig = { get: jest.fn().mockReturnValue('http://localhost:8080') };

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    post: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: {} }),
  }),
}));

describe('DialerService', () => {
  let service: DialerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DialerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CsvValidator, useValue: { validate: jest.fn().mockReturnValue({ total: 10, valid: 8, invalid: [], dncSkipped: 2 }) } },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();
    service = module.get<DialerService>(DialerService);
  });

  it('should list campaigns', async () => {
    mockPrisma.campaign.findMany.mockResolvedValue([{ id: 'c1', name: 'Test' }]);
    mockPrisma.campaign.count.mockResolvedValue(1);
    const result = await service.listCampaigns('u1');
    expect(result.data).toHaveLength(1);
  });

  it('should handle progress callback', async () => {
    mockPrisma.campaign.update.mockResolvedValue({});
    const result = await service.handleProgressCallback('c1', {
      dialed: 5, answered: 3, failed: 1, busy: 0, noAnswer: 1, remaining: 5,
    });
    expect(result.success).toBe(true);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('campaign:progress', expect.any(Object));
  });

  it('should emit campaign:complete when remaining is 0', async () => {
    mockPrisma.campaign.update.mockResolvedValue({});
    await service.handleProgressCallback('c1', {
      dialed: 10, answered: 8, failed: 1, busy: 0, noAnswer: 1, remaining: 0,
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('campaign:complete', expect.any(Object));
  });
});
