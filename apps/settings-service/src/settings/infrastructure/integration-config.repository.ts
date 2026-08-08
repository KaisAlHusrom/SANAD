import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository, DateTimeService, DRIZZLE } from '@sanad/database';
import {
  integrationConfigTable,
  type IntegrationConfigRow,
  type SettingsDb,
} from '../../db/schema/index.js';
import { integrationConfigModelConfig } from './integration-config.model-config.js';

/**
 * Repository for per-provider integration fields (N1). One live row per
 * (capability, provider, field) via the partial unique index. Reads strip the encrypted columns
 * (`hidden`, N2) by default; the `*WithSecret` reads opt in so the service can decrypt
 * server-side. Batch reads (a whole capability / a whole provider) keep the status endpoint
 * free of the per-key N+1 the old flat vault had.
 */
@Injectable()
export class IntegrationConfigRepository extends BaseRepository<
  typeof integrationConfigTable,
  IntegrationConfigRow
> {
  constructor(@Inject(DRIZZLE) db: SettingsDb, dateTime: DateTimeService) {
    super(db, dateTime, integrationConfigModelConfig);
  }

  /** Every live field row of a capability (all its providers) — masked. One query. */
  listByCapability(capability: string): Promise<IntegrationConfigRow[]> {
    return this.where('capability', 'eq', capability).all();
  }

  /** Every live field row of ONE provider, INCLUDING the encrypted columns (decrypt path). */
  listByProviderWithSecret(
    capability: string,
    provider: string,
  ): Promise<IntegrationConfigRow[]> {
    return this.withHidden()
      .where('capability', 'eq', capability)
      .where('provider', 'eq', provider)
      .all();
  }

  /** One live field row, masked — used to decide insert-vs-update on configure. */
  findField(
    capability: string,
    provider: string,
    fieldKey: string,
  ): Promise<IntegrationConfigRow | null> {
    return this.where('capability', 'eq', capability)
      .where('provider', 'eq', provider)
      .where('fieldKey', 'eq', fieldKey)
      .first();
  }
}
