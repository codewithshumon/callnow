import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  code: string;
  message: string | string[];
  field?: string;
}

/**
 * Global exception filter — catches all exceptions and returns them
 * in the VoiceLink standard error envelope { success: false, error: {...} }.
 *
 * Ref: API §10.1 (response envelope), API §Error Codes
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorBody: ErrorBody;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorBody = { code: this.statusToCode(status), message: exceptionResponse };
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        // Handle class-validator errors (array of validation errors)
        const messageArray = resp.message;
        const field = resp.field as string | undefined;

        errorBody = {
          code: (resp.code as string) || this.statusToCode(status),
          message: Array.isArray(messageArray)
            ? messageArray.map((m: unknown) => String(m))
            : (messageArray as string) || exception.message,
          ...(field ? { field } : {}),
        };
      } else {
        errorBody = { code: this.statusToCode(status), message: exception.message };
      }
    } else {
      // Non-HttpException: internal server error
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        exception instanceof Error ? exception.message : 'Internal server error';
      errorBody = { code: 'INTERNAL_ERROR', message };

      this.logger.error(
        `Unhandled exception: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    this.logger.warn(
      `${request.method} ${request.url} → ${status} ${errorBody.code}`,
    );

    response.status(status).json({
      success: false,
      error: errorBody,
    });
  }

  private statusToCode(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      case HttpStatus.BAD_GATEWAY:
        return 'PROVIDER_ERROR';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_ERROR';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
