import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PhoneOtpDto } from './dto/phone-otp.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import type { TelephonyProvider } from '../telephony/interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../telephony/telephony.module';

const BCRYPT_COST = 12; // SR-01

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(TELEPHONY_PROVIDER)
    private readonly telephonyProvider: TelephonyProvider,
  ) {}

  // ---------------------------------------------------------------------------
  // 3.2.2 — Register
  // ---------------------------------------------------------------------------
  async register(dto: RegisterDto) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Email already registered',
        field: 'email',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
      },
    });

    // Generate email verification token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.prisma.emailVerificationToken.create({
      data: {
        email: dto.email,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // Send verification email (log; SendGrid integration is Phase 9/billing)
    this.logger.log(`Verification token for ${dto.email}: ${token}`);

    return {
      user: { id: user.id, email: user.email },
      message: 'Verification email sent',
    };
  }

  // ---------------------------------------------------------------------------
  // 3.2.3 — Verify Email
  // ---------------------------------------------------------------------------
  async verifyEmail(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired verification token',
      });
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: record.email },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified' };
  }

  // ---------------------------------------------------------------------------
  // 3.2.4 — Login
  // ---------------------------------------------------------------------------
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    // If 2FA enabled, return a temporary loginToken for the 2FA step
    if (user.totpEnabled) {
      const loginToken = this.jwtService.sign(
        { sub: user.id, email: user.email, role: user.role, step: '2fa' },
        { expiresIn: '5m' },
      );
      return { requires2fa: true, loginToken };
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ---------------------------------------------------------------------------
  // 3.2.5 — Phone OTP Login
  // ---------------------------------------------------------------------------
  async loginPhoneOtp(dto: PhoneOtpDto) {
    if (dto.action === 'request') {
      return this.requestPhoneOtp(dto.phone);
    }
    return this.verifyPhoneOtp(dto.phone, dto.code || '');
  }

  private async requestPhoneOtp(phone: string) {
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, BCRYPT_COST);

    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash,
        action: 'login',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      },
    });

    // Send OTP via SMS through PAL
    try {
      await this.telephonyProvider.sendMessage({
        from: '+18000000000', // placeholder — actual from-number config required
        to: phone,
        body: `Your VoiceLink verification code: ${code}`,
      });
    } catch (error) {
      this.logger.error(`Failed to send OTP SMS to ${phone}`, error);
      // Don't expose provider errors to caller
    }

    this.logger.log(`OTP for ${phone}: ${code}`); // Fallback for dev
    return { message: 'Verification code sent' };
  }

  private async verifyPhoneOtp(phone: string, code: string) {
    const records = await this.prisma.otpCode.findMany({
      where: { phone, action: 'login', usedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const record = records[0];
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'OTP expired or not requested',
      });
    }

    if (record.attempts >= record.maxAttempts) {
      throw new BadRequestException({
        code: 'RATE_LIMITED',
        message: 'Too many OTP attempts',
      });
    }

    const valid = await bcrypt.compare(code, record.codeHash);
    if (!valid) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid verification code',
      });
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    // Find or create user by phone
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { email: `${phone}@phone.voicelink.local`, phone },
      });
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ---------------------------------------------------------------------------
  // 3.2.6 — Google OAuth Login
  // ---------------------------------------------------------------------------
  async googleLogin(idToken: string) {
    let payload: { sub: string; email: string };

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch (error) {
      this.logger.error('Google ID token verification failed', error);
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid Google token',
      });
    }

    // Find or create user by google_id
    let user = await this.prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          googleId: payload.sub,
          emailVerified: true,
        },
      });
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ---------------------------------------------------------------------------
  // 3.2.7 — Logout
  // ---------------------------------------------------------------------------
  async logout(refreshToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logged out' };
  }

  // ---------------------------------------------------------------------------
  // 3.2.8 — Refresh Token
  // ---------------------------------------------------------------------------
  async refresh(refreshToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Detect rotation attack: revoke entire family
      if (stored) {
        await this.prisma.refreshToken.updateMany({
          where: { family: stored.family },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      });
    }

    // Revoke current token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // Issue new pair
    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );
  }

  // ---------------------------------------------------------------------------
  // 3.2.9 — Forgot Password
  // ---------------------------------------------------------------------------
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success even if email not found (security best practice)
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      await this.prisma.passwordResetToken.create({
        data: {
          email,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      this.logger.log(`Password reset token for ${email}: ${token}`);
    }

    return {
      message: 'If the email exists, a reset link has been sent',
    };
  }

  // ---------------------------------------------------------------------------
  // 3.2.10 — Reset Password
  // ---------------------------------------------------------------------------
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired reset token',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);

    const user = await this.prisma.user.findUnique({
      where: { email: record.email },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revoke ALL refresh tokens for user (FR-AUTH-10)
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successful' };
  }

  // ---------------------------------------------------------------------------
  // 3.2.11 — Enable 2FA
  // ---------------------------------------------------------------------------
  async enable2fa(userId: string) {
    const secret = speakeasy.generateSecret({
      name: 'VoiceLink',
      length: 20,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Store the secret temporarily until verified
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret.base32 },
    });

    return { secret: secret.base32, qrCodeUrl };
  }

  // ---------------------------------------------------------------------------
  // 3.2.12 — Verify 2FA (during login)
  // ---------------------------------------------------------------------------
  async verify2fa(dto: Verify2faDto) {
    let payload: { sub: string; email: string; role: string; step: string };
    try {
      payload = this.jwtService.verify(dto.loginToken);
    } catch {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid or expired login token',
      });
    }

    if (payload.step !== '2fa') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Not a 2FA login token',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.totpSecret) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '2FA not configured',
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: dto.code,
      window: 2, // allow 1 step before/after for clock drift
    });

    if (!verified) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid 2FA code',
      });
    }

    // Enable TOTP if not already enabled
    if (!user.totpEnabled) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { totpEnabled: true },
      });
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ---------------------------------------------------------------------------
  // Token Helpers
  // ---------------------------------------------------------------------------
  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // FR-AUTH-05
      secret: this.configService.get<string>('jwt.accessSecret'),
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const family = crypto.randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      user: { id: userId, email, role },
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 min in seconds
    };
  }
}
