import {
  ValidationPipe as NestValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

/**
 * Global validation pipe configuration.
 *
 * Applies to all incoming requests:
 * - whitelist: true  → strips unknown properties
 * - forbidNonWhitelisted: true → throws if unknown properties present
 * - transform: true  → auto-transforms primitives (string→number, etc.)
 *
 * Ref: SDD §3.1 (common/pipes/)
 */
export const validationPipeOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  // Map class-validator errors to VoiceLink error format
  exceptionFactory: (errors) => {
    const { BadRequestException } = require('@nestjs/common');
    const messages = errors.flatMap((err) => {
      if (err.constraints) {
        return Object.values(err.constraints);
      }
      return [`Invalid value for ${err.property}`];
    });
    return new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: messages,
      field: errors[0]?.property,
    });
  },
};

/**
 * Pre-configured global ValidationPipe instance.
 * Use: app.useGlobalPipes(validationPipe) in main.ts
 */
export const validationPipe = new NestValidationPipe(validationPipeOptions);
