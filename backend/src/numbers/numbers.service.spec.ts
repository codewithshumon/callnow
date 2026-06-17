import { Test, TestingModule } from '@nestjs/testing';
import { NumbersService } from './numbers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  phoneNumber: {
    findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(),
    create: jest.fn(), update: jest.fn(),
  },
  subscription: { findUnique: jest.fn() },
};
const mockConfig = { get: jest.fn().mockReturnValue('redis://localhost:6381') };
const mockProvider = {
  name: 'twilio',
  searchAvailableNumbers: jest.fn().mockResolvedValue([]),
  provisionNumber: jest.fn(),
  releaseNumber: jest.fn().mockResolvedValue(undefined),
};

// Mock ioredis
jest.mock('ioredis', () => ({
  default: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  })),
}));

describe('NumbersService', () => {
  let service: NumbersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NumbersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: 'TELEPHONY_PROVIDER', useValue: mockProvider },
      ],
    }).compile();
    service = module.get<NumbersService>(NumbersService);
  });

  it('should list user numbers', async () => {
    mockPrisma.phoneNumber.findMany.mockResolvedValue([
      { id: 'n1', number: '+14155551234', status: 'active' },
    ]);
    const result = await service.getMyNumbers('u1');
    expect(result).toHaveLength(1);
  });

  it('should throw when provision exceeds plan limit', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({
      plan: { maxNumbers: 1 },
    });
    mockPrisma.phoneNumber.count.mockResolvedValue(1);
    await expect(
      service.provisionNumber('u1', '+14155559876'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw on releasing non-owned number', async () => {
    mockPrisma.phoneNumber.findFirst.mockResolvedValue(null);
    await expect(
      service.releaseNumber('u1', 'n99'),
    ).rejects.toThrow(NotFoundException);
  });
});
