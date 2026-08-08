import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import { beforeEach, describe, expect, it } from 'vitest';
import { DateTimeService } from '@sanad/database';
import { schema, type MediaDb } from '../../db/schema/index.js';
import { MediaFolderService } from '../application/media-folder.service.js';
import { MediaAssetRepository } from './persistence/media-asset.repository.js';
import { MediaFolderRepository } from './persistence/media-folder.repository.js';

/**
 * The folder-tree surface against a REAL database (TDD2 — the dedicated `media_test` DB).
 *
 * The pure nesting/cycle maths is unit-tested in `folder-tree.spec.ts`; what needs a live DB is
 * everything the maths can't see: the partial unique index, the soft-delete scope interacting
 * with name re-use, the grouped count query, and the bulk move. Skips cleanly when the DB is down.
 */

const TEST_DB_URL = 'postgresql://sanad:sanad@localhost:5440/media_test';
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

const pool = await tryConnect();
const runIf = pool ? describe : describe.skip;

runIf('MediaFolderService against media_test (TDD2)', () => {
  const db = drizzle(pool as pg.Pool, { schema }) as unknown as MediaDb;
  const clock = new DateTimeService();
  const folders = new MediaFolderRepository(db, clock);
  const assets = new MediaAssetRepository(db, clock);
  const service = new MediaFolderService(folders, assets);

  /** A `ready` asset filed in `folderId` — enough to make a folder "non-empty". */
  async function seedAsset(folderId: string | null): Promise<string> {
    const id = randomUUID();
    await db.execute(sql`
      insert into media_asset (id, folder_id, key, filename, mime_type, size, status)
      values (${id}, ${folderId}, ${`uploads/${id}/f.png`}, 'f.png', 'image/png', 10, 'ready')
    `);
    return id;
  }

  beforeEach(async () => {
    await db.execute(sql`delete from media_asset`);
    await db.execute(sql`delete from media_folder`);
  });

  it('creates a nested folder and returns it under its parent in the tree', async () => {
    const parent = await service.create({ name: 'Brand' });
    const child = await service.create({ name: 'Logos', parentId: parent.id });

    const tree = await service.tree();

    expect(tree.roots).toHaveLength(1);
    expect(tree.roots[0]?.id).toBe(parent.id);
    expect(tree.roots[0]?.children.map((node) => node.id)).toEqual([child.id]);
  });

  it('counts assets PER folder, plus the root, in the tree', async () => {
    const brand = await service.create({ name: 'Brand' });
    await seedAsset(brand.id);
    await seedAsset(brand.id);
    await seedAsset(null); // a file sitting at the root

    const tree = await service.tree();

    expect(tree.roots[0]?.assetCount).toBe(2);
    expect(tree.rootAssetCount).toBe(1);
  });

  it('REFUSES a duplicate name under the same parent (409, not a raw index violation)', async () => {
    await service.create({ name: 'Brand' });
    // The bug that filled the live library with fourteen "Brand" folders.
    await expect(service.create({ name: 'Brand' })).rejects.toMatchObject({
      error: { statusCode: 409 },
    });
  });

  it('treats names case-insensitively, as a person would', async () => {
    await service.create({ name: 'Brand' });
    await expect(service.create({ name: 'brand' })).rejects.toMatchObject({
      error: { statusCode: 409 },
    });
  });

  it('allows the same name under a DIFFERENT parent', async () => {
    const a = await service.create({ name: 'A' });
    const b = await service.create({ name: 'B' });
    await service.create({ name: 'Logos', parentId: a.id });
    await expect(
      service.create({ name: 'Logos', parentId: b.id }),
    ).resolves.toBeDefined();
  });

  it('frees a name again once the folder is deleted (the index is partial)', async () => {
    const first = await service.create({ name: 'Temp' });
    await service.remove({ id: first.id, strategy: 'block' });
    await expect(service.create({ name: 'Temp' })).resolves.toBeDefined();
  });

  it('renames a folder', async () => {
    const folder = await service.create({ name: 'Old' });
    const renamed = await service.update({ id: folder.id, name: 'New' });
    expect(renamed.name).toBe('New');
  });

  it('moves a folder under another, and back to the root', async () => {
    const parent = await service.create({ name: 'Parent' });
    const child = await service.create({ name: 'Child' });

    const moved = await service.update({ id: child.id, parentId: parent.id });
    expect(moved.parentId).toBe(parent.id);

    const returned = await service.update({ id: child.id, parentId: null });
    expect(returned.parentId).toBeNull();
  });

  it('REFUSES to move a folder into its own descendant (the tree would detach)', async () => {
    const parent = await service.create({ name: 'Parent' });
    const child = await service.create({ name: 'Child', parentId: parent.id });

    await expect(
      service.update({ id: parent.id, parentId: child.id }),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
  });

  it('REFUSES to delete a folder that still holds files, and says what is inside', async () => {
    const folder = await service.create({ name: 'Full' });
    await seedAsset(folder.id);

    await expect(
      service.remove({ id: folder.id, strategy: 'block' }),
    ).rejects.toMatchObject({
      error: { statusCode: 409, params: { assets: 1, folders: 0 } },
    });
  });

  it('`reparent` lifts the contents up one level instead of destroying them', async () => {
    const grandparent = await service.create({ name: 'GP' });
    const parent = await service.create({
      name: 'P',
      parentId: grandparent.id,
    });
    const child = await service.create({ name: 'C', parentId: parent.id });
    const assetId = await seedAsset(parent.id);

    await service.remove({ id: parent.id, strategy: 'reparent' });

    const tree = await service.tree();
    const gp = tree.roots.find((node) => node.id === grandparent.id);
    // the subfolder moved up…
    expect(gp?.children.map((node) => node.id)).toEqual([child.id]);
    // …and the asset came with it, still alive
    expect(gp?.assetCount).toBe(1);
    const survivor = await assets.find(assetId);
    expect(survivor).not.toBeNull();
  });

  it('moves assets in bulk and reports ids that no longer exist', async () => {
    const folder = await service.create({ name: 'Target' });
    const first = await seedAsset(null);
    const second = await seedAsset(null);
    const ghost = randomUUID();

    const result = await service.moveAssets({
      ids: [first, second, ghost],
      folderId: folder.id,
    });

    expect(result.movedIds.sort()).toEqual([first, second].sort());
    // never silently move fewer than asked (U23)
    expect(result.missingIds).toEqual([ghost]);

    const tree = await service.tree();
    expect(tree.roots[0]?.assetCount).toBe(2);
    expect(tree.rootAssetCount).toBe(0);
  });

  it('moves assets back to the root with an explicit null destination', async () => {
    const folder = await service.create({ name: 'Src' });
    const assetId = await seedAsset(folder.id);

    await service.moveAssets({ ids: [assetId], folderId: null });

    const tree = await service.tree();
    expect(tree.rootAssetCount).toBe(1);
  });

  it('404s for a folder that does not exist, rather than a silent no-op', async () => {
    await expect(
      service.update({ id: randomUUID(), name: 'x' }),
    ).rejects.toMatchObject({ error: { statusCode: 404 } });
  });
});
