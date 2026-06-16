import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Global response transform interceptor.
 *
 * Wraps all 2xx responses in VoiceLink's standard success envelope:
 *   { success: true, data }
 *
 * For paginated responses that include { data, meta }, unwraps to:
 *   { success: true, data, meta }
 *
 * Ref: SDD §10.1, API §10.1
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((responseData) => {
        // Pass through undefined/void responses (e.g., 204 No Content)
        if (responseData === undefined || responseData === null) {
          return { success: true, data: null };
        }

        // If response already has { success: ... }, pass through
        if (typeof responseData === 'object' && responseData !== null && 'success' in responseData) {
          return responseData;
        }

        // Paginated responses: the controller returns { data, meta }
        if (
          typeof responseData === 'object' &&
          responseData !== null &&
          'data' in responseData &&
          'meta' in responseData
        ) {
          const { data, meta } = responseData as Record<string, unknown>;
          return { success: true, data, meta };
        }

        // Standard response: wrap in { success: true, data }
        return { success: true, data: responseData };
      }),
    );
  }
}
