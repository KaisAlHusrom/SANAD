import { SetMetadata } from '@nestjs/common';

/** Metadata key the `PermissionsGuard` reads required permission keys from. */
export const PERMISSIONS_METADATA_KEY = 'sanad:required-permissions';

/**
 * Declare the `<resource>.<action>` permission(s) a route requires. The
 * `PermissionsGuard` enforces them against the caller's resolved permissions
 * (honoring the `manage` wildcards). All listed permissions must be satisfied.
 */
export const RequirePermissions = (
  ...permissions: string[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_METADATA_KEY, permissions);
