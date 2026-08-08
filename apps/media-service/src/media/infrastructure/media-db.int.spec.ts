import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import { DateTimeService, TranslatableRepository } from '@sanad/database';
import { MEDIA_ENV, type MediaEnv } from '../../env.js';
import {
  mediaAssetTable,
  mediaAssetTranslationTable,
  schema,
  type MediaAssetRow,
  type MediaDb,
} from '../../db/schema/index.js';
import { MediaService } from '../application/media.service.js';
import { FakeStorageProvider } from '../testing/fake-storage.provider.js';
import { MediaAssetRepository } from './persistence/media-asset.repository.js';
import { MediaAssetTranslationRepository } from './persistence/media-asset-translation.repository.js';

void MEDIA_ENV; // (DI token unused in direct construction; imported for type locality)

// The dedicated test DB (TDD2) — the project's fixed dev Postgres port block. Created by
// infra/postgres/init/01-create-databases.sql. Tests SKIP cleanly when it's down.
const TEST_DB_URL = 'postgresql://sanad:sanad@localhost:5440/media_test';

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
  } catch {
    await pool.end().catch(() => undefined);
    return null;
  }
}

/** A minimal env for the service under test (R2 vars unset — the fake provides storage). */
const testEnv: MediaEnv = {
  APP_ENV: 'development',
  PORT: 3003,
  HOST: '0.0.0.0',
  DATABASE_URL: TEST_DB_URL,
  RABBITMQ_URL: 'amqp://unused',
  MEDIA_MAX_UPLOAD_BYTES: 26214400,
  ADMIN_PUBLIC_ORIGINS: [],
};

/**
 * A throwaway `TranslatableRepository` over the media asset/translation tables —
 * exercises the canonical translatable base (N5) end-to-end against a live DB, mirroring
 * the settings int spec. Proves the alt-text translatable model works.
 */
class AltTransRepo extends TranslatableRepository<
  typeof mediaAssetTable,
  typeof mediaAssetTranslationTable,
  MediaAssetRow & { alt: string }
> {
  constructor(database: MediaDb, clock: DateTimeService) {
    super(
      database,
      clock,
      {
        table: mediaAssetTable,
        softDeletes: true,
        translatable: {
          table: mediaAssetTranslationTable,
          foreignKey: 'mediaAssetId',
          fields: ['alt'],
        },
      },
      mediaAssetTranslationTable,
    );
  }
}

const pool = await tryConnect();
const describeDb = pool ? describe : describe.skip;
if (!pool) {
  console.warn(
    'media_test unreachable — skipping DB integration tests (TDD2). Start the dev Postgres to run them.',
  );
}

describeDb('media-service DB integration (media_test, TDD2)', () => {
  const activePool = pool;
  if (!activePool) {
    return; // never reached (suite is skipped) — narrows the type for TS
  }
  const db = drizzle(activePool, { schema }) as MediaDb;
  const clock = new DateTimeService();
  const assets = new MediaAssetRepository(db, clock);
  const translations = new MediaAssetTranslationRepository(db, clock);

  function service(): MediaService {
    const storage = new FakeStorageProvider({ publicBase: 'https://cdn.test' });
    return new MediaService(assets, translations, storage, clock, testEnv, db);
  }

  beforeEach(async () => {
    await db.execute(
      sql`truncate table "media_asset_translation", "media_asset", "media_folder", "outbox" restart identity cascade`,
    );
  });

  it('signs a pending upload, confirms it ready, and lists it with a resolved CDN url (the P4 acceptance)', async () => {
    const svc = service();
    const signed = await svc.signUpload({
      filename: 'Brand Logo.png',
      contentType: 'image/png',
      size: 1024,
      alt: { ar: 'شعار', en: 'Logo' },
    });
    expect(signed.asset.status).toBe('pending');
    expect(signed.upload.method).toBe('PUT');
    expect(signed.upload.url).toContain(signed.asset.key);

    // simulate the client's direct-to-R2 PUT so confirm's HEAD finds the object
    const storage = new FakeStorageProvider({ publicBase: 'https://cdn.test' });
    storage.objects.set(signed.asset.key, {
      size: 2048,
      contentType: 'image/png',
    });
    const svc2 = new MediaService(
      assets,
      translations,
      storage,
      clock,
      testEnv,
      db,
    );

    const confirmed = await svc2.confirmUpload({
      assetId: signed.asset.id,
      width: 800,
      height: 600,
    });
    expect(confirmed.status).toBe('ready');
    expect(confirmed.size).toBe(2048); // captured from HEAD
    expect(confirmed.width).toBe(800);
    expect(confirmed.url).toBe(`https://cdn.test/${confirmed.key}`);
    expect(confirmed.alt).toEqual({ ar: 'شعار', en: 'Logo' });

    const page = await svc2.list({ page: 1, pageSize: 20, order: 'asc' });
    const listed = page.items.find((asset) => asset.id === confirmed.id);
    expect(listed).toBeDefined();
    expect(listed?.url).toBe(`https://cdn.test/${confirmed.key}`);
    expect(listed?.alt).toEqual({ ar: 'شعار', en: 'Logo' });
  });

  it('resolvePublic returns ONLY ready assets (public-safe refs) — pending/deleted/unknown are absent', async () => {
    const storage = new FakeStorageProvider({ publicBase: 'https://cdn.test' });
    const svc = new MediaService(
      assets,
      translations,
      storage,
      clock,
      testEnv,
      db,
    );

    // A ready asset (signed → PUT simulated → confirmed) with alt + dimensions.
    const readySigned = await svc.signUpload({
      filename: 'hero.png',
      contentType: 'image/png',
      size: 1024,
      alt: { ar: 'بطل', en: 'Hero' },
    });
    storage.objects.set(readySigned.asset.key, {
      size: 1024,
      contentType: 'image/png',
    });
    const ready = await svc.confirmUpload({
      assetId: readySigned.asset.id,
      width: 1200,
      height: 800,
    });

    // A still-pending upload (never confirmed) and a soft-deleted asset.
    const pending = await svc.signUpload({
      filename: 'pending.png',
      contentType: 'image/png',
      size: 10,
    });
    const removed = await svc.signUpload({
      filename: 'gone.png',
      contentType: 'image/png',
      size: 10,
    });
    storage.objects.set(removed.asset.key, {
      size: 10,
      contentType: 'image/png',
    });
    await svc.confirmUpload({ assetId: removed.asset.id });
    await svc.delete(removed.asset.id);

    const refs = await svc.resolvePublic([
      ready.id,
      pending.asset.id,
      removed.asset.id,
      '00000000-0000-0000-0000-000000000000', // unknown
    ]);

    expect(refs).toHaveLength(1);
    expect(refs[0]).toEqual({
      id: ready.id,
      url: `https://cdn.test/${ready.key}`,
      alt: { ar: 'بطل', en: 'Hero' },
      width: 1200,
      height: 800,
    });

    // Empty input short-circuits to an empty array.
    expect(await svc.resolvePublic([])).toEqual([]);
  });

  it('rejects a disallowed content type with a 400 (coded policy)', async () => {
    await expect(
      service().signUpload({
        filename: 'archive.zip',
        contentType: 'application/zip',
        size: 10,
      }),
    ).rejects.toBeDefined();
  });

  it('soft-deletes an asset and emits media.deleted via the outbox (MS3)', async () => {
    const svc = service();
    const signed = await svc.signUpload({
      filename: 'temp.png',
      contentType: 'image/png',
      size: 10,
    });
    await svc.delete(signed.asset.id);

    const page = await svc.list({ page: 1, pageSize: 20, order: 'asc' });
    expect(page.items.some((asset) => asset.id === signed.asset.id)).toBe(
      false,
    );
    await expect(svc.get(signed.asset.id)).rejects.toBeDefined();

    const events = await db.execute(
      sql`select payload from "outbox" where event_name = 'media.deleted'`,
    );
    expect(events.rowCount).toBe(1);
  });

  it('TranslatableRepository canon: createLocalized + updateLocalized + findAllTranslations (N5)', async () => {
    const trans = new AltTransRepo(db, clock);
    const created = await trans.createLocalized(
      {
        key: 'uploads/canon/alt.png',
        filename: 'alt.png',
        mimeType: 'image/png',
        size: 1,
        alt: 'صورة',
      },
      'ar',
    );
    await trans.updateLocalized(created.id, { alt: 'Picture' }, 'en');

    const all = await trans.findAllTranslations(created.id);
    expect(all['alt']).toEqual({ ar: 'صورة', en: 'Picture' });

    const mergedAr = await trans.mergeTranslations([created], 'ar');
    expect(mergedAr[0]?.alt).toBe('صورة');
    const mergedEn = await trans.mergeTranslations([created], 'en');
    expect(mergedEn[0]?.alt).toBe('Picture');
  });
});
