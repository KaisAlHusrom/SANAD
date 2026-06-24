import { z } from 'zod';

/** Create a media folder (POST /api/media/folders). Strict (N7). `.zod.types` (U16). */
export const folderCreateRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    parentId: z.string().uuid().optional(),
  })
  .strict();

export type FolderCreateRequest = z.infer<typeof folderCreateRequestSchema>;

/** List media folders (GET /api/media/folders), optionally under a parent. Strict (N7). */
export const folderListQuerySchema = z
  .object({
    parentId: z.string().uuid().optional(),
  })
  .strict();

export type FolderListQuery = z.infer<typeof folderListQuerySchema>;
