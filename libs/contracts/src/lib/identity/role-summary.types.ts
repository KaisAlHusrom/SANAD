/**
 * A role as the admin users surface lists it (`identity.roles.read`). The bounded role
 * catalog (no pagination). `key` matches the `Role` union; `name`/`description` are the
 * display copy seeded with each role. Pure response shape (U16).
 */
export interface RoleSummary {
  key: string;
  name: string;
  description: string | null;
}
