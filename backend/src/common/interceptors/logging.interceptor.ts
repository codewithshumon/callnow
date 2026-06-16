import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Global request logging interceptor.
 *
 * Logs every request: method, URL, userId (if authenticated), duration, status code.
 *
 * Ref: SDD §3.1 (common/interceptors/)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const reqUser = (request as unknown as { user?: { id?: string } }).user;
    const userId = reqUser?.id ?? 'anonymous';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} | user=${userId} | ${statusCode} | ${duration}ms`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} | user=${userId} | ERROR | ${duration}ms | ${error.message}`,
          );
        },
      }),
    );
  }
}
