import { z } from 'zod';

/**
 * A portfolio project's publish state (WEB2): `draft` (admin-only) or `published` (visible on
 * the public website). Mirrors the `portfolio_status` Postgres enum (U3). The gateway forces
 * `published` on the public list/detail so drafts never leak.
 */
export const portfolioStatusSchema = z.enum(['draft', 'published']);

export type PortfolioStatus = z.infer<typeof portfolioStatusSchema>;
