// The RBAC policy is single-sourced in `@sanad/contracts` (U3) so the gateway and the
// portal evaluate permissions identically. Re-exported here as the portal's auth-data
// entry point; gate UI with `hasPermission(selectPermissions(state), 'content.manage')`.
export {
  hasPermission,
  identityHasPermission,
  GLOBAL_MANAGE_PERMISSION,
} from '@sanad/contracts';
