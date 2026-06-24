/**
 * The public view of a user (no password, no internal columns — N2). `roles`
 * carries role keys as strings: the canonical `Role` union lives in `@sanad/auth`
 * (`type:util`), which `@sanad/contracts` (`type:types`) must not depend on, so the
 * wire DTO stays dependency-free. Returned by `identity.users.list` and `auth.me`.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: readonly string[];
  isActive: boolean;
}
