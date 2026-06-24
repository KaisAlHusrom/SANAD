// jsonwebtoken is CJS — default-import the module object (its named exports aren't
// reliably exposed to Node's ESM loader), then read `verify` off it.
import jwt from 'jsonwebtoken';
import {
  accessTokenPayloadSchema,
  type AccessTokenPayload,
} from '../../jwt-payload.js';
import { TokenVerifier } from './token-verifier.js';

/** Options for the RS256 verifier — only the public key is needed to verify. */
export interface JwtVerifierOptions {
  /** The RS256 PEM public key (the private key never leaves the issuer, decision 2). */
  publicKey: string;
}

/**
 * Verifies access tokens with RS256 + the issuer's public key, then validates the
 * decoded claims against the strict `accessTokenPayloadSchema` (never trust an
 * un-validated decode, U15). Stateless — no DB, no network.
 */
export class JwtTokenVerifier extends TokenVerifier {
  constructor(private readonly options: JwtVerifierOptions) {
    super();
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, this.options.publicKey, {
      algorithms: ['RS256'],
    });
    return accessTokenPayloadSchema.parse(decoded);
  }
}
