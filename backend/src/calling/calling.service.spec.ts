import { Test, TestingModule } from '@nestjs/testing';
import { CallingService } from './calling.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const mockPrisma = {
  user: { findUnique: jest.fn() },
  call: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  voicemail: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn(),
  ping: jest.fn().mockResolvedValue('PONG'),
};
const mockProvider = {
  name: 'twilio',
  generateClientToken: jest
    .fn()
    .mockResolvedValue({ token: 'mock-token', expiresIn: 3300 }),
};

describe('CallingService', () => {
  let service: CallingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: 'TELEPHONY_PROVIDER', useValue: mockProvider },
      ],
    }).compile();
    service = module.get<CallingService>(CallingService);
  });

  it('should generate a call token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    const result = await service.getCallToken('u1');
    expect(result.token).toBe('mock-token');
    expect(result.provider).toBe('twilio');
  });

  it('should return call history', async () => {
    mockPrisma.call.findMany.mockResolvedValue([
      { id: 'c1', status: 'completed' },
    ]);
    mockPrisma.call.count.mockResolvedValue(1);
    const result = await service.getCallHistory('u1');
    expect(result.data).toHaveLength(1);
  });

  it('should create a CDR', async () => {
    mockPrisma.call.create.mockResolvedValue({ id: 'c1', status: 'initiated' });
    const result = await service.createCallRecord(
      'u1',
      'CA123',
      'twilio',
      '+14155551234',
      '+447911123456',
      'outbound',
    );
    expect(result.status).toBe('initiated');
  });
});
