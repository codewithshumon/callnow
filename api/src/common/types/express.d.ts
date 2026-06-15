import type { JwtPayload } from '../../auth/strategies/jwt.strategy';

/**
 * Extend Express Request to include the authenticated user.
 * JwtStrategy attaches the user object to request.user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { scopes?: string[]; authType?: string };
    }
  }
}

export {};
