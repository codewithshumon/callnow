import { Test, TestingModule } from '@nestjs/testing';
import { DialerCallbackController } from './dialer-callback.controller';
import { DialerService } from '../dialer.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

const mockDialerService = { handleProgressCallback: jest.fn().mockResolvedValue({ success: true }) };
const mockConfig = { get: jest.fn().mockReturnValue('secret-internal-key') };

describe('DialerCallbackController', () => {
  let controller: DialerCallbackController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DialerCallbackController],
      providers: [
        { provide: DialerService, useValue: mockDialerService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    controller = module.get<DialerCallbackController>(DialerCallbackController);
  });

  it('should reject missing API key', async () => {
    await expect(
      controller.handleProgress('', {
        campaignId: 'c1', dialed: 1, answered: 1, failed: 0, busy: 0, noAnswer: 0, remaining: 9,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject wrong API key', async () => {
    await expect(
      controller.handleProgress('Bearer wrong-key', {
        campaignId: 'c1', dialed: 1, answered: 1, failed: 0, busy: 0, noAnswer: 0, remaining: 9,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should accept correct API key', async () => {
    const result = await controller.handleProgress('Bearer secret-internal-key', {
      campaignId: 'c1', dialed: 1, answered: 1, failed: 0, busy: 0, noAnswer: 0, remaining: 9,
    });
    expect(result.success).toBe(true);
    expect(mockDialerService.handleProgressCallback).toHaveBeenCalled();
  });
});
