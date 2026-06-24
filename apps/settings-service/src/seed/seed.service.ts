import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { SettingRepository } from '../settings/infrastructure/setting.repository.js';
import { SETTINGS_CATALOG } from './seed-data.js';

/**
 * Idempotently seeds the settings **catalog** at boot (descriptor rows the resolver +
 * admin editor need). Safe to run every start — `ensureSetting` upserts by key. No
 * `setting_value` rows are seeded, so branding resolves to coded defaults until an
 * admin sets a value (the P3 acceptance).
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly settings: SettingRepository) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const entry of SETTINGS_CATALOG) {
      await this.settings.ensureSetting(entry);
    }
    this.logger.log(`Seeded ${SETTINGS_CATALOG.length} settings catalog rows`);
  }
}
