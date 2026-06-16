import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { validationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 14.1.2 — CORS with explicit allowlist (SR-04)
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 14.1.3 — Global pipes, filters, interceptors
  app.useGlobalPipes(validationPipe);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // 14.1.4 — Swagger/OpenAPI docs at GET /api/v1/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('VoiceLink API')
    .setDescription('VoiceLink — International Calling & Messaging Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);

  // 14.1.5 — Global prefix, excluding webhook/internal/health routes
  app.setGlobalPrefix('api/v1', {
    exclude: ['webhooks/(.*)', 'internal/(.*)', 'health'],
  });

  // 14.1.6 — Listen on PORT
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`VoiceLink API listening on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/v1/docs`);
}

bootstrap();
