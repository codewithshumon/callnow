import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * User payload shape extracted from JWT.
 * Update this interface as the JWT payload evolves.
 */
export interface JwtUser {
  id: string;
  email: string;
  role: string;
}

/**
 * @CurrentUser() parameter decorator.
 *
 * Extracts the authenticated user from `request.user` (set by JwtStrategy).
 * Usage:
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: JwtUser) { ... }
 *
 * Optionally pass a property name to extract a single field:
 *   getProfile(@CurrentUser('id') userId: string) { ... }
 *
 * Ref: SDD §3.1 (common/decorators/)
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext): JwtUser | string => {
    const request = ctx.switchToHttp().getRequest<
      Request & { user?: JwtUser }
    >();
    const user = request.user;

    if (!user) {
      return undefined as unknown as JwtUser;
    }

    return data ? user[data] : user;
  },
);
