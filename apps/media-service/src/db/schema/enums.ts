import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Postgres enums mirroring the contract unions (`@sanad/contracts`). Kept here so the
 * migrations create the types in this service's own DB (MS5). Values MUST match the
 * Zod enum (`mediaAssetStatusSchema`).
 */
export const mediaAssetStatusEnum = pgEnum('media_asset_status', [
  'pending',
  'ready',
]);
