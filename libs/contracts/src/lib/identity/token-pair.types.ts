/**
 * The access + refresh token pair returned by login and refresh. The access token
 * is a short-lived RS256 JWT carrying identity + resolved permissions; the refresh
 * token is opaque-to-clients and rotated on every use (persisted hashed server-side).
 */
export interface TokenPair {
  access: string;
  refresh: string;
}
