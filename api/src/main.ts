import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { validationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes — Phase 1.4
  app.useGlobalPipes(validationPipe);

  // Global filters — Phase 1.1
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors — Phase 1.2 + 1.3
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // CORS — explicit allowlist from config (SR-04)
  // Full Swagger/global-prefix setup deferred to Phase 14
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`VoiceLink API listening on port ${port}`);
}

bootstrap();
