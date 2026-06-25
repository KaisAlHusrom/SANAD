import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository, DateTimeService, DRIZZLE } from '@sanad/database';
import {
  integrationSecretTable,
  type IntegrationSecretRow,
  type SettingsDb,
} from '../../db/schema/index.js';
import { integrationSecretModelConfig } from './integration-secret.model-config.js';

/**
 * Repository for encrypted integration-secret rows (N1). One live row per key (the partial
 * unique index). Reads strip the encrypted columns (`hidden`, N2) by default; `withSecret`
 * opts in so the service can decrypt server-side.
 */
@Injectable()
export class IntegrationSecretRepository extends BaseRepository<
  typeof integrationSecretTable,
  IntegrationSecretRow
> {
  constructor(@Inject(DRIZZLE) db: SettingsDb, dateTime: DateTimeService) {
    super(db, dateTime, integrationSecretModelConfig);
  }

  /** The masked row for a key (encrypted columns stripped), or null when unset/cleared. */
  findByKey(key: string): Promise<IntegrationSecretRow | null> {
    return this.where('key', 'eq', key).first();
  }

  /** The row including the encrypted columns — used server-side for decryption only. */
  findByKeyWithSecret(key: string): Promise<IntegrationSecretRow | null> {
    return this.withHidden().where('key', 'eq', key).first();
  }
}
