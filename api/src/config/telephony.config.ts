import { registerAs } from '@nestjs/config';

export default registerAs('telephony', () => ({
  provider: process.env.TELEPHONY_PROVIDER || 'twilio',

  // Twilio (active in v1)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    apiKey: process.env.TWILIO_API_KEY || '',
    apiSecret: process.env.TWILIO_API_SECRET || '',
  },

  // Vonage (stub in v1)
  vonage: {
    apiKey: process.env.VONAGE_API_KEY || '',
    apiSecret: process.env.VONAGE_API_SECRET || '',
    applicationId: process.env.VONAGE_APPLICATION_ID || '',
    privateKey: process.env.VONAGE_PRIVATE_KEY || '',
  },

  // Bandwidth (stub in v1)
  bandwidth: {
    username: process.env.BANDWIDTH_USERNAME || '',
    password: process.env.BANDWIDTH_PASSWORD || '',
    accountId: process.env.BANDWIDTH_ACCOUNT_ID || '',
    applicationId: process.env.BANDWIDTH_APPLICATION_ID || '',
  },

  // Plivo (stub in v1)
  plivo: {
    authId: process.env.PLIVO_AUTH_ID || '',
    authToken: process.env.PLIVO_AUTH_TOKEN || '',
  },

  // Telnyx (stub in v1)
  telnyx: {
    apiKey: process.env.TELNYX_API_KEY || '',
    publicKey: process.env.TELNYX_PUBLIC_KEY || '',
  },
}));
