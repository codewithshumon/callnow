import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  dialerServiceUrl: process.env.DIALER_SERVICE_URL || 'http://localhost:8080',
  internalApiKey: process.env.INTERNAL_API_KEY || 'change-me-internal-key',
}));
