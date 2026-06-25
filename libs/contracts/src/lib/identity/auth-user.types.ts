/**
 * The public view of a user (no password, no internal columns — N2). `roles`
 * carries role keys as strings; the canonical `Role` union now lives alongside this
 * file in `@sanad/contracts` (`./role.ts`), but the wire DTO keeps `string[]` so a
 * stale token or older role isn't rejected at the boundary. Returned by
 * `identity.users.list` and `auth.me`.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: readonly string[];
  isActive: boolean;
}
