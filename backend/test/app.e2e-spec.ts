import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { validationPipe } from './../src/common/pipes/validation.pipe';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

describe('VoiceLink API E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(validationPipe);
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    app.setGlobalPrefix('api/v1', {
      exclude: ['webhooks/(.*)', 'internal/(.*)', 'health'],
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check (Phase 16.4)', () => {
    it('/health (GET) should return 200 or 503 status report', async () => {
      const res = await request(app.getHttpServer()).get('/health');
      expect([200, 503]).toContain(res.status);
      const data = res.body.data || res.body;
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('db');
      expect(data).toHaveProperty('redis');
      expect(data).toHaveProperty('dialer');
    });
  });

  describe('Internal Dialer Callback Auth (Phase 8.4, 15.2.10)', () => {
    it('should reject callback without authorization header', async () => {
      await request(app.getHttpServer())
        .post('/internal/dialer/callback')
        .send({
          campaignId: '00000000-0000-0000-0000-000000000001',
          dialed: 10,
          answered: 5,
          failed: 1,
          busy: 1,
          noAnswer: 3,
          remaining: 90,
        })
        .expect(401);
    });

    it('should reject callback with invalid internal API key', async () => {
      await request(app.getHttpServer())
        .post('/internal/dialer/callback')
        .set('Authorization', 'Bearer wrong-secret-key')
        .send({
          campaignId: '00000000-0000-0000-0000-000000000001',
          dialed: 10,
          answered: 5,
          failed: 1,
          busy: 1,
          noAnswer: 3,
          remaining: 90,
        })
        .expect(401);
    });
  });

  describe('Auth Guard Protections (Phase 3.1)', () => {
    it('/api/v1/numbers (GET) requires JWT', async () => {
      await request(app.getHttpServer()).get('/api/v1/numbers').expect(401);
    });

    it('/api/v1/calls (GET) requires JWT', async () => {
      await request(app.getHttpServer()).get('/api/v1/calls').expect(401);
    });

    it('/api/v1/conversations (GET) requires JWT', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/conversations')
        .expect(401);
    });

    it('/api/v1/campaigns (GET) requires JWT', async () => {
      await request(app.getHttpServer()).get('/api/v1/campaigns').expect(401);
    });
  });

  describe('Input Validation Pipe (Phase 1.4)', () => {
    it('/api/v1/auth/register (POST) rejects invalid email and weak password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: '123',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('/api/v1/auth/login (POST) rejects missing credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
