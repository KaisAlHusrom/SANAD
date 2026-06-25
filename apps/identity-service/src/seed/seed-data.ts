import { ALL_ROLES, GLOBAL_MANAGE_PERMISSION, type Role } from '@sanad/auth';
import {
  CONTENT_PERMISSIONS,
  IDENTITY_PERMISSIONS,
  MEDIA_PERMISSIONS,
  NOTIFICATION_PERMISSIONS,
  SECRET_PERMISSIONS,
  SECRET_REGISTRY_LIST,
  SETTINGS_PERMISSIONS,
} from '@sanad/contracts';

/**
 * The per-integration secret-manage permissions (N13 — each third party owns its
 * permission), deduped from the registry so a new integration auto-extends the catalog.
 */
const SECRET_MANAGE_CATALOG: ReadonlyArray<[key: string, description: string]> =
  [
    ...new Map(
      SECRET_REGISTRY_LIST.map((entry) => [
        entry.managePermission,
        `Manage ${entry.feature} integration secrets`,
      ]),
    ),
  ];

/** The permission catalog seeded into the identity DB (key → description). */
export const PERMISSION_CATALOG: ReadonlyArray<
  [key: string, description: string]
> = [
  [GLOBAL_MANAGE_PERMISSION, 'Full access to everything (superadmin)'],
  [IDENTITY_PERMISSIONS.usersRead, 'View users'],
  [IDENTITY_PERMISSIONS.usersManage, 'Manage users'],
  [IDENTITY_PERMISSIONS.rolesRead, 'View roles'],
  [IDENTITY_PERMISSIONS.rolesManage, 'Manage roles'],
  [MEDIA_PERMISSIONS.read, 'View media'],
  [MEDIA_PERMISSIONS.manage, 'Manage media'],
  [CONTENT_PERMISSIONS.read, 'View content'],
  [CONTENT_PERMISSIONS.manage, 'Manage content (pages, services, blog, leads)'],
  [NOTIFICATION_PERMISSIONS.read, 'View in-app notifications'],
  [NOTIFICATION_PERMISSIONS.manage, 'Manage notifications'],
  [SETTINGS_PERMISSIONS.read, 'View settings'],
  [SETTINGS_PERMISSIONS.manage, 'Manage settings & branding'],
  [SECRET_PERMISSIONS.read, 'View integration secret statuses'],
  ...SECRET_MANAGE_CATALOG,
];

/** A seeded role: its display name + the permission keys it grants. */
export interface RoleSeed {
  key: Role;
  name: string;
  description: string;
  permissions: string[];
}

const ROLE_NAMES: Record<Role, string> = {
  admin: 'Administrator',
  developer: 'Developer',
  designer: 'Designer',
  qa: 'QA Engineer',
  blog_writer: 'Blog Writer',
  business_manager: 'Business Manager',
  client: 'Client',
};

/**
 * Role → permission seed. Admin holds the global `manage` wildcard (tiny token,
 * decision 1); the business manager can read users; everyone else starts with none
 * (services grant more as their domains arrive).
 */
export const ROLE_CATALOG: readonly RoleSeed[] = ALL_ROLES.map((key) => ({
  key,
  name: ROLE_NAMES[key],
  description: `${ROLE_NAMES[key]} role`,
  permissions:
    key === 'admin'
      ? [GLOBAL_MANAGE_PERMISSION]
      : key === 'business_manager'
        ? [IDENTITY_PERMISSIONS.usersRead]
        : [],
}));
