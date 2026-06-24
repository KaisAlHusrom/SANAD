import { describe, expect, it } from 'vitest';
import type { MediaAssetRow } from '../../db/schema/index.js';
import { assembleMediaAsset } from './media.assembler.js';

function row(overrides: Partial<MediaAssetRow> = {}): MediaAssetRow {
  return {
    id: 'asset-1',
    folderId: null,
    key: 'uploads/asset-1/logo.png',
    filename: 'logo.png',
    mimeType: 'image/png',
    size: 1234,
    width: null,
    height: null,
    status: 'ready',
    createdAt: new Date('2026-06-23T00:00:00.000Z'),
    updatedAt: new Date('2026-06-23T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

describe('assembleMediaAsset', () => {
  it('resolves the public CDN url from the key and serializes timestamps', () => {
    const asset = assembleMediaAsset(
      row(),
      { ar: 'شعار', en: 'Logo' },
      (key) => `https://cdn.test/${key}`,
    );
    expect(asset.url).toBe('https://cdn.test/uploads/asset-1/logo.png');
    expect(asset.alt).toEqual({ ar: 'شعار', en: 'Logo' });
    expect(asset.createdAt).toBe('2026-06-23T00:00:00.000Z');
    expect(asset.size).toBe(1234);
    expect(asset.status).toBe('ready');
  });

  it('passes through nullable folder + dimensions', () => {
    const asset = assembleMediaAsset(
      row({ folderId: 'f1', width: 800, height: 600 }),
      { ar: '', en: '' },
      (key) => key,
    );
    expect(asset.folderId).toBe('f1');
    expect(asset.width).toBe(800);
    expect(asset.height).toBe(600);
    expect(asset.url).toBe('uploads/asset-1/logo.png');
  });
});
