import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { NumbersService } from '../numbers/numbers.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  conversation: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
  message: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
  phoneNumber: { findFirst: jest.fn() },
};
const mockNumbers = { getUserByNumber: jest.fn().mockResolvedValue(null) };
const mockConfig = { get: jest.fn().mockReturnValue('redis://localhost:6383') };
const mockEventEmitter = { emit: jest.fn() };
const mockProvider = {
  name: 'twilio',
  sendMessage: jest.fn().mockResolvedValue({ providerSid: 'SM123', status: 'queued' }),
};

jest.mock('ioredis', () => ({
  default: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  })),
}));

describe('MessagingService', () => {
  let service: MessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NumbersService, useValue: mockNumbers },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: 'TELEPHONY_PROVIDER', useValue: mockProvider },
      ],
    }).compile();
    service = module.get<MessagingService>(MessagingService);
  });

  it('should send an SMS and return message', async () => {
    mockPrisma.phoneNumber.findFirst.mockResolvedValue({ number: '+14155551234', status: 'active', userId: 'u1' });
    mockPrisma.conversation.findUnique.mockResolvedValue({ id: 'c1', userId: 'u1', fromNumber: '+14155551234', toNumber: '+447911123456' });
    mockPrisma.message.create.mockResolvedValue({
      id: 'm1', providerSid: 'SM123', provider: 'twilio', direction: 'outbound',
      body: 'Hello', status: 'queued',
    });

    const result = await service.sendMessage('u1', {
      fromNumber: '+14155551234', toNumber: '+447911123456', body: 'Hello',
    });
    expect(result.status).toBe('queued');
    expect(mockProvider.sendMessage).toHaveBeenCalled();
  });

  it('should throw on unowned from-number', async () => {
    mockPrisma.phoneNumber.findFirst.mockResolvedValue(null);
    await expect(
      service.sendMessage('u1', { fromNumber: '+14155551234', toNumber: '+447911123456', body: 'Hi' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return paginated conversations', async () => {
    mockPrisma.conversation.findMany.mockResolvedValue([{ id: 'c1' }]);
    mockPrisma.conversation.count.mockResolvedValue(1);
    const result = await service.getConversations('u1', 1, 20);
    expect(result.data).toHaveLength(1);
  });
});
