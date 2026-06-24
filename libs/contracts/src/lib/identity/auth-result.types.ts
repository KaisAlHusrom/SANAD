import type { AuthUser } from './auth-user.types.js';
import type { TokenPair } from './token-pair.types.js';

/** What `identity.auth.login` returns: the issued token pair plus the public user. */
export interface AuthResult {
  tokens: TokenPair;
  user: AuthUser;
}
