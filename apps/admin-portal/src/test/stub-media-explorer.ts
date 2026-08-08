import type {
  MediaAsset,
  MediaFolder,
  MediaFolderNode,
  MediaFolderTree,
} from '@sanad/contracts';
import { vi } from 'vitest';

/** A ready image asset with sensible defaults — override only what a test is about. */
export function makeAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'a1',
    folderId: null,
    key: 'media/a1.png',
    url: 'https://cdn/a1.png',
    filename: 'a1.png',
    mimeType: 'image/png',
    size: 10,
    width: 100,
    height: 100,
    status: 'ready',
    alt: { ar: '', en: '' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** A folder tree node with defaults. */
export function makeFolderNode(
  overrides: Partial<MediaFolderNode> & { id: string; name: string },
): MediaFolderNode {
  return {
    parentId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    assetCount: 0,
    children: [],
    ...overrides,
  };
}

export interface MediaExplorerStubOptions {
  assets?: MediaAsset[];
  tree?: MediaFolderTree;
  folders?: MediaFolder[];
  /** Status for the asset LIST call — 503 is the "storage never configured" state. */
  listStatus?: number;
  /** Status for the folder TREE call, so the tree's own error state can be driven alone. */
  treeStatus?: number;
}

export interface MediaExplorerStub {
  /** Every gateway url requested, in order — for asserting what the explorer asked for. */
  urls: string[];
}

/**
 * Stub the gateway calls the media explorer makes (test util): the folder tree and the asset list.
 *
 * They are separate endpoints with separate failure modes, and the explorer renders them as
 * separate states (a broken tree does not blank the files, and vice versa) — so the stub lets a
 * test drive either one independently.
 */
export function stubMediaExplorerFetch({
  assets = [],
  tree = { roots: [], rootAssetCount: 0 },
  folders = [],
  listStatus = 200,
  treeStatus = 200,
}: MediaExplorerStubOptions = {}): MediaExplorerStub {
  const stub: MediaExplorerStub = { urls: [] };

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: Request | string) => {
      const url = typeof input === 'string' ? input : input.url;
      stub.urls.push(url);

      if (url.includes('/media/folders/tree')) {
        return Promise.resolve(
          json(
            treeStatus === 200
              ? { success: true, message: 'ok', data: tree }
              : { success: false, message: 'tree failed' },
            treeStatus,
          ),
        );
      }
      if (url.includes('/media/folders')) {
        return Promise.resolve(
          json({ success: true, message: 'ok', data: folders }, 200),
        );
      }
      return Promise.resolve(
        json(
          listStatus === 200
            ? {
                success: true,
                message: 'ok',
                data: {
                  items: assets,
                  meta: {
                    page: 1,
                    pageSize: 48,
                    total: assets.length,
                    totalPages: assets.length > 0 ? 1 : 0,
                  },
                },
              }
            : { success: false, message: 'list failed' },
          listStatus,
        ),
      );
    }),
  );

  return stub;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
