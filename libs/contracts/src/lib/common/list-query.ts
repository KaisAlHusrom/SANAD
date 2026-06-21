import { z } from 'zod';

/** Default page size used across list endpoints when none is supplied. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Standard query for paginated, searchable, sortable lists. Strict so unknown
 * query keys are rejected (N7). Values are coerced from the query string.
 */
export const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
    search: z.string().trim().min(1).optional(),
    sort: z.string().trim().min(1).optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  })
  .strict();

export type ListQuery = z.infer<typeof listQuerySchema>;
