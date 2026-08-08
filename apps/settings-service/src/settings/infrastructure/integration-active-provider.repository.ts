import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository, DateTimeService, DRIZZLE } from '@sanad/database';
import {
  integrationActiveProviderTable,
  type IntegrationActiveProviderRow,
  type SettingsDb,
} from '../../db/schema/index.js';
import { integrationActiveProviderModelConfig } from './integration-config.model-config.js';

/**
 * Repository for the active-provider selection (N1) — one live row per capability, enforced by
 * the unique index, so a capability can never have two active providers.
 */
@Injectable()
export class IntegrationActiveProviderRepository extends BaseRepository<
  typeof integrationActiveProviderTable,
  IntegrationActiveProviderRow
> {
  constructor(@Inject(DRIZZLE) db: SettingsDb, dateTime: DateTimeService) {
    super(db, dateTime, integrationActiveProviderModelConfig);
  }

  /** Every capability's active provider, in one query (the status endpoint reads all). */
  listAll(): Promise<IntegrationActiveProviderRow[]> {
    return this.query().all();
  }

  findByCapability(
    capability: string,
  ): Promise<IntegrationActiveProviderRow | null> {
    return this.where('capability', 'eq', capability).first();
  }

  /** Point a capability at a provider — updates the existing row or creates the first one. */
  async setActive(
    capability: string,
    provider: string,
    userId: string | null,
  ): Promise<void> {
    const existing = await this.findByCapability(capability);
    if (existing) {
      await this.update(existing.id, { provider, updatedByUserId: userId });
      return;
    }
    await this.create({ capability, provider, updatedByUserId: userId });
  }
}
