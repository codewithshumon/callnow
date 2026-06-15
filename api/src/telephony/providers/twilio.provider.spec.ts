import { Test, TestingModule } from '@nestjs/testing';
import { TwilioProvider } from './twilio.provider';
import { ConfigService } from '@nestjs/config';

const mockConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'telephony.twilio') {
      return { accountSid: 'AC123', authToken: 'token123', apiKey: 'SK123', apiSecret: 'secret123' };
    }
    return null;
  }),
};

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    availablePhoneNumbers: () => ({ local: { list: jest.fn().mockResolvedValue([]) } }),
    incomingPhoneNumbers: jest.fn().mockReturnValue({
      create: jest.fn().mockResolvedValue({
        sid: 'PN123', phoneNumber: '+14155551234', friendlyName: 'Test',
        isoCountry: 'US', capabilities: { voice: true, sms: true, mms: false },
      }),
      remove: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue({}),
    }),
    messages: { create: jest.fn().mockResolvedValue({ sid: 'SM123', status: 'queued' }) },
    calls: { create: jest.fn().mockResolvedValue({ sid: 'CA123', status: 'queued' }) },
    recordings: jest.fn().mockReturnValue({
      fetch: jest.fn().mockResolvedValue({ uri: '/recordings/RE123.json', duration: '30' }),
    }),
    transcriptions: { list: jest.fn().mockResolvedValue([]) },
  }));
});

jest.mock('twilio/lib/jwt/AccessToken', () => ({
  AccessToken: jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn().mockReturnValue('mock-token'),
  })),
}));

jest.mock('twilio/lib/jwt/AccessToken', () => ({
  VoiceGrant: jest.fn(),
}));

describe('TwilioProvider', () => {
  let provider: TwilioProvider;

  beforeEach(async () => {
    // Clear the module cache to get a fresh Twilio mock
    jest.resetModules();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwilioProvider,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    provider = module.get<TwilioProvider>(TwilioProvider);
  });

  it('should have name twilio', () => {
    expect(provider.name).toBe('twilio');
  });

  it('should have correct capabilities', () => {
    expect(provider.capabilities.voice).toBe(true);
    expect(provider.capabilities.sms).toBe(true);
  });

  it('should search available numbers', async () => {
    const result = await provider.searchAvailableNumbers({
      countryCode: 'US', areaCode: '415',
    });
    expect(result).toBeDefined();
  });

  it('should provision a number', async () => {
    const result = await provider.provisionNumber('+14155551234', {
      baseUrl: 'https://api.voicelink.io', provider: 'twilio',
    });
    expect(result.number).toBe('+14155551234');
  });

  it('should send an SMS', async () => {
    const result = await provider.sendMessage({
      from: '+14155551234', to: '+447911123456', body: 'Hello',
    });
    expect(result.status).toBe('queued');
  });

  it('should generate TwiML for reject', () => {
    const twiml = provider.generateCallControlResponse({ type: 'reject' });
    expect(twiml).toContain('Reject');
  });

  it('should parse inbound message webhook', () => {
    const normalized = provider.parseInboundMessageWebhook({
      body: { MessageSid: 'SM123', From: '+14155559999', To: '+14155551234', Body: 'Hi', NumMedia: '0' },
      headers: {},
    });
    expect(normalized.from).toBe('+14155559999');
    expect(normalized.body).toBe('Hi');
  });

  it('should parse inbound call webhook', () => {
    const normalized = provider.parseInboundCallWebhook({
      body: { CallSid: 'CA123', From: '+14155559999', To: '+14155551234' },
      headers: {},
    });
    expect(normalized.providerCallSid).toBe('CA123');
  });
});
