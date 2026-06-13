import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
  accessExpiry: '15m',
  refreshExpiry: '30d',
}));
