import type { IdentityContext } from '@sanad/contracts';

/**
 * The minimal request shape the auth guards read/write — declared locally so the
 * lib doesn't couple to Express types. The `JwtAuthGuard` attaches `identity` after
 * verifying the bearer token; `@CurrentUser()` and `PermissionsGuard` read it.
 */
export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  identity?: IdentityContext;
}
