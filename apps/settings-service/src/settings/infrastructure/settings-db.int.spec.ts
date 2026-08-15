import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, beforeEach } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import {
  AuditRecorder,
  auditLogTable,
  DrizzleAuditStore,
  type AuditScope,
} from '@sanad/audit';
import { RedisCache, type RedisClient } from '@sanad/cache';
import {
  DateTimeService,
  DrizzleTransactionRunner,
  TranslatableRepository,
  failIfDbTestsRequired,
} from '@sanad/database';
import {
  schema,
  settingTranslationTable,
  settingValueTable,
  type SettingsDb,
  type SettingValueRow,
} from '../../db/schema/index.js';
import { SETTINGS_CATALOG } from '../../seed/seed-data.js';
import { SETTINGS_DEFAULTS } from '../application/branding-catalog.js';
import { BrandingService } from '../application/branding.service.js';
import { SettingsCatalogService } from '../application/settings-catalog.service.js';
import { SettingsResolver } from '../application/settings.resolver.js';
import { SettingsWriter } from '../application/settings/settings.writer.js';
import { SettingRepository } from './setting.repository.js';
import { SettingValueRepository } from './setting-value.repository.js';
import { SettingTranslationRepository } from './setting-translation.repository.js';

// The dedicated test DB (TDD2) — the project's fixed dev Postgres port block. Created
// by infra/postgres/init/01-create-databases.sql. Tests SKIP cleanly when it's down.
const TEST_DB_URL = 'postgresql://sanad:sanad@localhost:5440/settings_test';

// Resolve the migrations dir from THIS file, not the CWD — vitest's cwd differs by how it is
// invoked, and a CWD-relative path made `migrate()` throw and the suite SILENTLY skip (false green).
const MIGRATIONS_DIR = fileURLToPath(
  new URL('../../db/migrations', import.meta.url),
);

async function tryConnect(): Promise<pg.Pool | null> {
  const pool = new pg.Pool({
    connectionString: TEST_DB_URL,
    options: '-c timezone=UTC',
  });
  try {
    await pool.query('select 1');
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_DIR });
    return pool;
  } catch (error) {
    await pool.end().catch(() => undefined);
    failIfDbTestsRequired(TEST_DB_URL, error);
    return null;
  }
}

/** In-memory Redis fake — same surface used by the cache lib's unit tests. */
function fakeCache(): RedisCache {
  const store = new Map<string, string>();
  const client: RedisClient = {
    get: async (key) => store.get(key) ?? null,
    set: async (key, value) => void store.set(key, value),
    setex: async (key, _seconds, value) => void store.set(key, value),
    del: async (key) => (store.delete(key) ? 1 : 0),
    incr: async (key) => {
      const next = Number(store.get(key) ?? '0') + 1;
      store.set(key, String(next));
      return next;
    },
  };
  return new RedisCache(client);
}

/**
 * A throwaway `TranslatableRepository` over the settings value/translation tables —
 * exercises the canonical translatable base (N5) end-to-end. P5 content-service is its
 * real first user; this proves the base works against a live DB now.
 */
class ValueTransRepo extends TranslatableRepository<
  typeof settingValueTable,
  typeof settingTranslationTable,
  SettingValueRow
> {
  constructor(database: SettingsDb, clock: DateTimeService) {
    super(
      database,
      clock,
      {
        table: settingValueTable,
        softDeletes: true,
        translatable: {
          table: settingTranslationTable,
          foreignKey: 'settingValueId',
          fields: ['value'],
        },
      },
      settingTranslationTable,
    );
  }
}

const pool = await tryConnect();
const describeDb = pool ? describe : describe.skip;
if (!pool) {
  console.warn(
    'settings_test unreachable — skipping DB integration tests (TDD2). Start the dev Postgres to run them.',
  );
}

describeDb('settings-service DB integration (settings_test, TDD2)', () => {
  const activePool = pool;
  if (!activePool) {
    return; // never reached (suite is skipped) — narrows the type for TS
  }
  const db = drizzle(activePool, { schema }) as SettingsDb;
  const clock = new DateTimeService();
  const settings = new SettingRepository(db, clock);
  const values = new SettingValueRepository(db, clock);
  const translations = new SettingTranslationRepository(db, clock);
  const resolver = new SettingsResolver(settings, values, translations);
  const txRunner = new DrizzleTransactionRunner(db);
  const catalogService = new SettingsCatalogService(resolver);

  async function seedCatalog(): Promise<void> {
    for (const entry of SETTINGS_CATALOG) {
      await settings.ensureSetting(entry);
    }
  }

  const recorder = new AuditRecorder(new DrizzleAuditStore(), clock);

  /** The actor the gateway would have forwarded in the RMQ headers (MS4 + P8.8). */
  const auditScope: AuditScope = {
    actor: {
      userId: '11111111-1111-4111-8111-111111111111',
      role: 'admin',
      type: 'user',
    },
    context: { ip: '85.10.1.4', userAgent: 'Mozilla/5.0', requestId: 'req-77' },
  };

  function writer(cache: RedisCache): SettingsWriter {
    return new SettingsWriter(
      settings,
      values,
      translations,
      cache,
      clock,
      txRunner,
      resolver,
      recorder,
    );
  }

  function service(): BrandingService {
    // Branding read + the generic writer share one cache so version bumps are seen.
    const cache = fakeCache();
    return new BrandingService(resolver, cache, writer(cache));
  }

  beforeEach(async () => {
    await db.execute(
      sql`truncate table "setting_translation", "setting_value", "setting", "outbox", "audit_log" restart identity cascade`,
    );
  });

  it('seeds the catalog idempotently (ensureSetting upserts by key)', async () => {
    await seedCatalog();
    await seedCatalog();
    const rows = await settings.findByGroup('branding');
    expect(rows.length).toBe(SETTINGS_CATALOG.length);
    const primary = await settings.findByKey('branding.colors.primary');
    expect(primary?.type).toBe('color');
  });

  it('upserts one global value per setting (partial-unique, no duplicate)', async () => {
    await seedCatalog();
    const setting = await settings.findByKey('branding.colors.primary');
    expect(setting).not.toBeNull();
    const id = setting?.id ?? '';
    await values.upsert(db, id, 'global', null, '#111111');
    await values.upsert(db, id, 'global', null, '#222222');
    const row = await values.findOne(id, 'global', null);
    expect(row?.value).toBe('#222222');
    const all = await values.findForSettings([id], 'global', null);
    expect(all.length).toBe(1);
  });

  it('upserts a translation per (value, locale) composite key', async () => {
    await seedCatalog();
    const setting = await settings.findByKey('branding.brand.name');
    const valueRow = await values.upsert(
      db,
      setting?.id ?? '',
      'global',
      null,
      null,
    );
    await translations.upsert(db, valueRow.id, 'ar', 'الأول');
    await translations.upsert(db, valueRow.id, 'ar', 'الثاني');
    const rows = await translations.findForValues([valueRow.id]);
    expect(rows.length).toBe(1);
    expect(rows[0]?.value).toBe('الثاني');
  });

  it('returns coded-default branding when nothing is set (the P3 acceptance)', async () => {
    await seedCatalog();
    const record = await service().getBranding({ scope: 'global' });
    expect(record.brand.name).toEqual({
      ar: 'سَنَد التقنية',
      en: 'Sanad Tech',
    });
    expect(record.colors.primary).toBe('#22d3ee');
    expect(record.logoUrl).toBeNull();
  });

  it('applies a branding update, resolves it, and emits an outbox event', async () => {
    await seedCatalog();
    const svc = service();
    const updated = await svc.updateBranding(
      {
        colors: { primary: '#ff0000' },
        brand: { name: { ar: 'مخصص', en: 'Custom' } },
      },
      { scope: 'global' },
    );
    expect(updated.colors.primary).toBe('#ff0000');
    expect(updated.brand.name).toEqual({ ar: 'مخصص', en: 'Custom' });

    // a fresh read (fresh cache) still reflects the persisted value
    const reread = await service().getBranding({ scope: 'global' });
    expect(reread.colors.primary).toBe('#ff0000');

    // a settings.changed event was enqueued in the same transaction (MS3)
    const events = await db.execute(
      sql`select event_name from "outbox" where event_name = 'settings.changed'`,
    );
    expect(events.rowCount).toBe(1);
  });

  it('falls back per-locale to the coded default for a partial localized override', async () => {
    await seedCatalog();
    await service().updateBranding(
      { brand: { name: { ar: 'سَنَد فقط', en: '' } } },
      { scope: 'global' },
    );
    const record = await service().getBranding({ scope: 'global' });
    expect(record.brand.name.ar).toBe('سَنَد فقط');
    expect(record.brand.name.en).toBe('Sanad Tech'); // coded default fills empty locale
  });

  it('catalog returns descriptors grouped by section with resolved values (coded default when unset)', async () => {
    await seedCatalog();
    const catalog = await catalogService.getCatalog({ scope: 'global' });
    const branding = catalog.groups.find((group) => group.group === 'branding');
    expect(branding).toBeDefined();
    const colors = branding?.sections.find((s) => s.section === 'colors');
    const primary = colors?.fields.find(
      (f) => f.key === 'branding.colors.primary',
    );
    expect(primary?.type).toBe('color');
    expect(primary?.requirement).toBe('optional');
    expect(primary?.value).toBe('#22d3ee'); // coded default, never blank (F7)
  });

  it('the generic writer sets a scalar value and the catalog reflects it', async () => {
    await seedCatalog();
    await writer(fakeCache()).setMany(
      [{ key: 'branding.colors.primary', value: '#abcdef' }],
      { scope: 'global' },
    );
    const catalog = await catalogService.getCatalog({ scope: 'global' });
    const primary = catalog.groups[0]?.sections
      .find((s) => s.section === 'colors')
      ?.fields.find((f) => f.key === 'branding.colors.primary');
    expect(primary?.value).toBe('#abcdef');
  });

  it('the generic writer round-trips a localized_text value across both locales', async () => {
    await seedCatalog();
    await writer(fakeCache()).setMany(
      [{ key: 'branding.brand.name', value: { ar: 'اسم', en: 'Name' } }],
      { scope: 'global' },
    );
    const catalog = await catalogService.getCatalog({ scope: 'global' });
    const name = catalog.groups[0]?.sections
      .find((s) => s.section === 'identity')
      ?.fields.find((f) => f.key === 'branding.brand.name');
    expect(name?.value).toEqual({ ar: 'اسم', en: 'Name' });
  });

  it('CLEARS a localized_text back to the coded default when set to null (U9)', async () => {
    await seedCatalog();
    const w = writer(fakeCache());
    // Set an override, then clear it — the per-locale rows must go with it, otherwise the
    // resolver re-assembles the stale text over the cleared value.
    await w.setMany(
      [{ key: 'branding.brand.name', value: { ar: 'مؤقّت', en: 'Temporary' } }],
      { scope: 'global' },
    );
    await w.setMany([{ key: 'branding.brand.name', value: null }], {
      scope: 'global',
    });

    const catalog = await catalogService.getCatalog({ scope: 'global' });
    const name = catalog.groups[0]?.sections
      .find((s) => s.section === 'identity')
      ?.fields.find((f) => f.key === 'branding.brand.name');
    expect(name?.value).toEqual(SETTINGS_DEFAULTS['branding.brand.name']);
    expect(name?.value).not.toEqual({ ar: 'مؤقّت', en: 'Temporary' });
  });

  it('the generic writer rejects a value of the wrong descriptor type (N7)', async () => {
    await seedCatalog();
    await expect(
      writer(fakeCache()).setMany(
        [{ key: 'branding.colors.primary', value: 123 }],
        { scope: 'global' },
      ),
    ).rejects.toThrow();
  });

  it('TranslatableRepository canon: createLocalized + findAllTranslations + mergeTranslations', async () => {
    await seedCatalog();
    const setting = await settings.findByKey('branding.brand.name');
    const trans = new ValueTransRepo(db, clock);

    const ar = await trans.createLocalized(
      {
        settingId: setting?.id ?? '',
        scope: 'global',
        scopeId: null,
        value: 'مرحبا',
      },
      'ar',
    );
    await trans.updateLocalized(ar.id, { value: 'Hello' }, 'en');

    const all = await trans.findAllTranslations(ar.id);
    expect(all['value']).toEqual({ ar: 'مرحبا', en: 'Hello' });

    const mergedAr = await trans.mergeTranslations([ar], 'ar');
    expect(mergedAr[0]?.value).toBe('مرحبا');
    const mergedEn = await trans.mergeTranslations([ar], 'en');
    expect(mergedEn[0]?.value).toBe('Hello');
  });

  // ── P8.8: the audited write path, end to end against the real DB ────────────────────
  it('writes an IMMUTABLE audit row with actor + ip + before/after for a settings change', async () => {
    await seedCatalog();
    await recorder.runInScope(auditScope, async () => {
      await writer(fakeCache()).setMany(
        [{ key: 'branding.colors.primary', value: '#123456' }],
        { scope: 'global' },
      );
    });

    const rows = await db.select().from(auditLogTable);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: 'settings.updated',
      entityType: 'setting',
      entityId: 'branding.colors.primary',
      actorUserId: auditScope.actor.userId,
      actorRole: 'admin',
      actorType: 'user',
      ip: '85.10.1.4',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-77',
      outcome: 'succeeded',
    });
    // The BEFORE side is the previously-resolved value (here the coded default, U9), so the
    // trail reads as a change and not as a create.
    expect((rows[0]?.after as { value?: unknown })?.value).toBe('#123456');
    expect((rows[0]?.before as { value?: unknown })?.value).not.toBe('#123456');

    // Append-only is enforced by the trigger the --custom migration installed, in THIS
    // service's database — not merely by the shared lib's own test DB.
    await expect(
      db.execute(sql`update "audit_log" set action = 'tampered'`),
    ).rejects.toThrow();
    const [unchanged] = await db.select().from(auditLogTable);
    expect(unchanged?.action).toBe('settings.updated');
  });

  it('leaves NO audit row when the settings write is rejected', async () => {
    await seedCatalog();
    await recorder.runInScope(auditScope, async () => {
      await expect(
        writer(fakeCache()).setMany(
          [{ key: 'branding.colors.primary', value: 42 }],
          { scope: 'global' },
        ),
      ).rejects.toThrow();
    });
    expect(await db.select().from(auditLogTable)).toHaveLength(0);
  });
});
