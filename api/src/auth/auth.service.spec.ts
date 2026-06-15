import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  emailVerificationToken: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  passwordResetToken: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  otpCode: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  refreshToken: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  $transaction: jest.fn((fns: unknown[]) => Promise.all(fns as Promise<unknown>[])),
};

const mockJwt = { sign: jest.fn().mockReturnValue('mock-access-token'), verify: jest.fn() };
const mockConfig = { get: jest.fn().mockReturnValue('test-secret') };
const mockProvider = { sendMessage: jest.fn(), name: 'twilio' };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: 'TELEPHONY_PROVIDER', useValue: mockProvider },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  // 15.1.1 — Register
  describe('register', () => {
    it('should create a user and return a verification message', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: 'u1', email: 'test@example.com' });
      mockPrisma.emailVerificationToken.create.mockResolvedValue({});

      const result = await service.register({ email: 'test@example.com', password: 'Test123!' });
      expect(result.user.email).toBe('test@example.com');
      expect(result.message).toContain('Verification email sent');
    });

    it('should throw if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({ email: 'test@example.com', password: 'Test123!' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // 15.1.1 — Login
  describe('login', () => {
    it('should return access + refresh tokens on valid credentials', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('Test123!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'test@example.com', passwordHash: hash, role: 'user', totpEnabled: false,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      const result = await service.login({ email: 'test@example.com', password: 'Test123!' });
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw on invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'test@example.com', passwordHash: 'badhash', role: 'user', totpEnabled: false,
      });
      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // 15.1.1 — Refresh rotation
  describe('refresh', () => {
    it('should issue new tokens and revoke old', async () => {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update('old-token').digest('hex');
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt1', tokenHash: hash, family: 'fam1', revokedAt: null,
        expiresAt: new Date(Date.now() + 999999),
        user: { id: 'u1', email: 'test@example.com', role: 'user' },
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      const result = await service.refresh('old-token');
      expect(result.accessToken).toBeDefined();
    });
  });
});
