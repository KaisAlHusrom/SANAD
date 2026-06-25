import { z } from 'zod';

/** Staff roles (internal users). One Identity service, scoped roles. */
export const STAFF_ROLES = [
  'admin',
  'developer',
  'designer',
  'qa',
  'blog_writer',
  'business_manager',
] as const;

/** The single client-facing role. */
export const CLIENT_ROLE = 'client' as const;

export const roleSchema = z.enum([...STAFF_ROLES, CLIENT_ROLE]);

export type Role = z.infer<typeof roleSchema>;

export const ALL_ROLES: readonly Role[] = [...STAFF_ROLES, CLIENT_ROLE];

/** True when the role is an internal staff role (not the client role). */
export function isStaffRole(role: Role): boolean {
  return (STAFF_ROLES as readonly string[]).includes(role);
}
