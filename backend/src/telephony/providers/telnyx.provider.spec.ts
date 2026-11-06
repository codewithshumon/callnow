import { Test, TestingModule } from '@nestjs/testing';
import { TelnyxProvider } from './telnyx.provider';
import { ConfigService } from '@nestjs/config';

const mockConfig = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'telephony.telnyx') {
      return {
        apiKey: 'KEY_test123',
        publicKey: 'pub_key_123',
        connectionId: 'conn_123',
      };
    }
    return null;
  }),
};

describe('TelnyxProvider', () => {
  let provider: TelnyxProvider;

  beforeEach(async () => {
    jest.resetModules();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelnyxProvider,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    provider = module.get<TelnyxProvider>(TelnyxProvider);
  });

  it('should have name telnyx', () => {
    expect(provider.name).toBe('telnyx');
  });

  it('should have correct capabilities', () => {
    expect(provider.capabilities.voice).toBe(true);
    expect(provider.capabilities.sms).toBe(true);
    expect(provider.capabilities.voicemailTranscription).toBe(false);
  });

  it('should generate TeXML call control response', () => {
    const xml = provider.generateCallControlResponse({ type: 'reject' });
    expect(xml).toContain('<Reject/>');

    const dialClient = provider.generateCallControlResponse({
      type: 'dial-client',
      clientId: 'user-123',
    });
    expect(dialClient).toContain('<Client>user-123</Client>');
  });

  it('should generate a client token for WebRTC', async () => {
    const res = await provider.generateClientToken('user-123');
    expect(res.token).toBeDefined();
    expect(res.expiresIn).toBe(3600);
  });

  it('should parse inbound message webhook', () => {
    const normalized = provider.parseInboundMessageWebhook({
      body: {
        data: {
          event_type: 'message.received',
          id: 'msg-123',
          payload: {
            from: { phone_number: '+14155559999' },
            to: [{ phone_number: '+14155551234' }],
            text: 'Hello from Telnyx',
          },
        },
      },
      headers: {},
    });

    expect(normalized.providerMessageSid).toBe('msg-123');
    expect(normalized.from).toBe('+14155559999');
    expect(normalized.body).toBe('Hello from Telnyx');
  });

  it('should parse inbound call webhook', () => {
    const normalized = provider.parseInboundCallWebhook({
      body: {
        data: {
          event_type: 'call.initiated',
          payload: {
            call_control_id: 'call-ctrl-123',
            from: '+14155559999',
            to: '+14155551234',
          },
        },
      },
      headers: {},
    });

    expect(normalized.providerCallSid).toBe('call-ctrl-123');
    expect(normalized.from).toBe('+14155559999');
    expect(normalized.to).toBe('+14155551234');
  });

  it('should parse status callback and normalize status', () => {
    const normalized = provider.parseStatusCallback({
      body: {
        data: {
          event_type: 'call.answered',
          payload: {
            call_control_id: 'call-ctrl-123',
          },
        },
      },
      headers: {},
    });

    expect(normalized.providerSid).toBe('call-ctrl-123');
    expect(normalized.resourceType).toBe('call');
    expect(normalized.status).toBe('in-progress');
  });
});
