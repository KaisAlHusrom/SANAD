import type { AccessTokenPayload } from '../../jwt-payload.js';

/**
 * The seam the gateway/guards verify access tokens through. Declared as an abstract
 * class so it doubles as the Nest DI token and the type, and so guards are unit-
 * testable by plain construction with a fake (N11). The RS256 implementation is
 * `JwtTokenVerifier`. Throws on an invalid/expired/tampered token.
 */
export abstract class TokenVerifier {
  abstract verifyAccessToken(token: string): AccessTokenPayload;
}
