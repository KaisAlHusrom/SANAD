import { z } from 'zod';

/**
 * A service's grouping on the website (WEB1): `core` services (SaaS, mobile, LMS, ERP)
 * vs `support` capabilities (UX, integrations, cloud, post-launch support). Mirrors the
 * `service_category` Postgres enum (U3) and the `services` page in `content-defaults.md`.
 */
export const serviceCategorySchema = z.enum(['core', 'support']);

export type ServiceCategory = z.infer<typeof serviceCategorySchema>;
