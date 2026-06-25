// @sanad/auth — the NestJS auth adapters (guards/decorators/verifiers/helpers) plus
// the JWT payload schema. Roles, the identity context, and the RBAC policy now live
// in `@sanad/contracts` (the single source, U3) so the browser portals can share
// them without pulling NestJS in; re-exported here so backend callers keep importing
// every auth symbol from one place. U10 barrel.
export {
  STAFF_ROLES,
  CLIENT_ROLE,
  ALL_ROLES,
  roleSchema,
  type Role,
  isStaffRole,
  identityContextSchema,
  type IdentityContext,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  isStaff,
  GLOBAL_MANAGE_PERMISSION,
  MANAGE_ACTION,
  hasPermission,
  identityHasPermission,
} from '@sanad/contracts';
export * from './lib/jwt-payload.js';
export * from './lib/nest/index.js';
