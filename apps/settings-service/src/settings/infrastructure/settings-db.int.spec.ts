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
  auditTestResetSql,
  DrizzleAuditStore,
  type AuditScope,
} from '@sanad/audit';
import { RedisCache, type RedisClient } from '@sanad/cache';
import {
  CONSENT_SETTING_KEYS,
  RATE_LIMIT_DEFAULTS,
  SECURITY_GROUP,
  SECURITY_SETTING_KEYS,
  TRACKING_GROUP,
  trackingDestinationSettingKeys,
} from '@sanad/contracts';
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
import { BRANDING_SETTING_DEFAULTS } from '../application/branding-catalog.js';
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
    // `audit_log` is truncate-guarded, so it resets through the audit lib's sanctioned path
    // (TDD2, `settings_test` only) rather than in the bulk statement with the mutable tables.
    await db.execute(sql.raw(auditTestResetSql()));
    await db.execute(
      sql`truncate table "setting_translation", "setting_value", "setting", "outbox" restart identity cascade`,
    );
  });

  it('seeds the catalog idempotently (ensureSetting upserts by key)', async () => {
    await seedCatalog();
    await seedCatalog();
    // Per GROUP, not against the whole catalog — P8.10.A added `security`, so comparing a
    // branding query to `SETTINGS_CATALOG.length` silently became an off-by-seven.
    const branding = await settings.findByGroup('branding');
    expect(branding.length).toBe(
      SETTINGS_CATALOG.filter((row) => row.group === 'branding').length,
    );
    const primary = await settings.findByKey('branding.colors.primary');
    expect(primary?.type).toBe('color');
  });

  it('seeds the security group alongside branding, with its coded defaults', async () => {
    await seedCatalog();
    const security = await settings.findByGroup(SECURITY_GROUP);
    expect(security.length).toBe(
      SETTINGS_CATALOG.filter((row) => row.group === SECURITY_GROUP).length,
    );
    const leadLimit = await settings.findByKey(SECURITY_SETTING_KEYS.leadLimit);
    expect(leadLimit?.type).toBe('number');
    expect(Number(leadLimit?.defaultValue)).toBe(
      RATE_LIMIT_DEFAULTS.lead.limit,
    );
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
    expect(name?.value).toEqual(
      BRANDING_SETTING_DEFAULTS['branding.brand.name'],
    );
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

  // ── P8.23.A1: the `tracking` group, end to end through the real catalog + writer ──────
  it('seeds the tracking group with every destination off and no id', async () => {
    await seedCatalog();
    const rows = await settings.findByGroup(TRACKING_GROUP);
    expect(rows.length).toBe(
      SETTINGS_CATALOG.filter((row) => row.group === TRACKING_GROUP).length,
    );
    const ga4 = await settings.findByKey(
      trackingDestinationSettingKeys('ga4').id,
    );
    expect(ga4?.type).toBe('text');
    expect(ga4?.defaultValue).toBeNull();
  });

  /**
   * The descriptor→writer wiring, proven rather than assumed: a pattern that stopped at the
   * field list would validate nothing, and the wrong id would be accepted and then fail
   * silently for as long as the campaign ran.
   */
  it('the generic writer rejects a vendor id of the wrong shape (U0)', async () => {
    await seedCatalog();
    await expect(
      writer(fakeCache()).setMany(
        [
          {
            key: trackingDestinationSettingKeys('ga4').id,
            // A GTM container pasted into the GA4 field — the exact real-world mistake.
            value: 'GTM-ABCDE12',
          },
        ],
        { scope: 'global' },
      ),
    ).rejects.toThrow();
  });

  it('accepts a well-shaped vendor id and surfaces it on the catalog', async () => {
    await seedCatalog();
    const key = trackingDestinationSettingKeys('ga4').id;
    await writer(fakeCache()).setMany([{ key, value: 'G-ABCDE12345' }], {
      scope: 'global',
    });
    const catalog = await catalogService.getCatalog({ scope: 'global' });
    const field = catalog.groups
      .find((group) => group.group === TRACKING_GROUP)
      ?.sections.find((s) => s.section === 'destinations')
      ?.fields.find((f) => f.key === key);
    expect(field?.value).toBe('G-ABCDE12345');
    // The control needs the shape to refuse a bad paste before the round trip.
    expect(field?.pattern).toBe('^G-[A-Z0-9]{4,20}$');
    expect(field?.patternExample).toBe('G-ABCDE12345');
  });

  /**
   * An all-digit vendor id — a **Meta pixel**, the single most common paid destination — must
   * come back as the STRING it was written as. Found by the runtime gate: it resolved as the
   * number `123456789012345`, so the gateway's `typeof raw === 'string'` check dropped the
   * destination from the public config and the admin field rendered blank. Silent on every
   * layer, and only for the ids that happen to be all digits.
   */
  it('round-trips an ALL-DIGIT vendor id as a string, not a number', async () => {
    await seedCatalog();
    const key = trackingDestinationSettingKeys('metaPixel').id;
    await writer(fakeCache()).setMany([{ key, value: '123456789012345' }], {
      scope: 'global',
    });

    const resolved = await resolver.resolveGroup(TRACKING_GROUP, {
      scope: 'global',
    });
    expect(typeof resolved[key]).toBe('string');
    expect(resolved[key]).toBe('123456789012345');

    const catalog = await catalogService.getCatalog({ scope: 'global' });
    const field = catalog.groups
      .find((group) => group.group === TRACKING_GROUP)
      ?.sections.find((s) => s.section === 'destinations')
      ?.fields.find((f) => f.key === key);
    expect(field?.value).toBe('123456789012345');
  });

  it('CLEARS a vendor id with null rather than failing its pattern (U9)', async () => {
    await seedCatalog();
    const key = trackingDestinationSettingKeys('ga4').id;
    const w = writer(fakeCache());
    await w.setMany([{ key, value: 'G-ABCDE12345' }], { scope: 'global' });
    await w.setMany([{ key, value: null }], { scope: 'global' });
    const catalog = await catalogService.getCatalog({ scope: 'global' });
    const field = catalog.groups
      .find((group) => group.group === TRACKING_GROUP)
      ?.sections.find((s) => s.section === 'destinations')
      ?.fields.find((f) => f.key === key);
    expect(field?.value).toBeNull();
  });

  it('rejects a remember-days outside its bounds with a named cause, not a silent clamp', async () => {
    await seedCatalog();
    await expect(
      writer(fakeCache()).setMany(
        [{ key: CONSENT_SETTING_KEYS.rememberDays, value: 4000 }],
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
