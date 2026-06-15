import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';

/**
 * Request ID interceptor — ensures every request has an X-Request-ID header.
 * If the client sends one, it's preserved. Otherwise, a UUID v4 is generated.
 * The request ID is added to the response header.
 *
 * Ref: SDD §3.1 (common/interceptors/)
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId =
      (request.headers['x-request-id'] as string) || randomUUID();

    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-ID', requestId);

    return next.handle();
  }
}
