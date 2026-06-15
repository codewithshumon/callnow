import { Injectable } from '@nestjs/common';

/**
 * Google OAuth 2.0 strategy.
 *
 * The frontend handles the full OAuth 2.0 flow (redirect, consent screen).
 * The backend only receives and validates the Google ID token (idToken).
 *
 * All validation logic lives in AuthService.googleLogin(idToken).
 * This file exists as a placeholder for future passport-google-oauth20
 * server-side flow if needed (PAL §9).
 *
 * Ref: FR-AUTH-06, US-003
 */
@Injectable()
export class GoogleStrategy {
  // Reserved for server-side Google OAuth flow (future phase).
  // Current implementation in AuthService uses google-auth-library directly.
}
