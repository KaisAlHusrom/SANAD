import { z } from 'zod';

/** Metadata describing a page of results. */
export const paginationMetaSchema = z
  .object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .strict();

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** Build pagination metadata from a total count and the active page/size. */
export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}
