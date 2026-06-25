import { configureStore } from '@reduxjs/toolkit';
import type {
  MediaAsset,
  MediaFolder,
  Paginated,
  UploadSignResult,
} from '@sanad/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authReducer } from '../../../data/auth/auth.slice';
import { eventBus } from '../../../data/events/event-bus';
import { mediaApi } from './media.api';

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, [mediaApi.reducerPath]: mediaApi.reducer },
    middleware: (getDefault) => getDefault().concat(mediaApi.middleware),
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const asset: MediaAsset = {
  id: 'a1',
  folderId: null,
  key: 'media/a1.png',
  url: 'https://cdn.example.com/media/a1.png',
  filename: 'a1.png',
  mimeType: 'image/png',
  size: 10,
  width: null,
  height: null,
  status: 'ready',
  alt: { ar: '', en: '' },
  createdAt: '2026-06-25T00:00:00.000Z',
  updatedAt: '2026-06-25T00:00:00.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mediaApi', () => {
  it('signs an upload (POST /media/uploads)', async () => {
    const signResult: UploadSignResult = {
      asset: { ...asset, status: 'pending', url: 'presigned' },
      upload: {
        url: 'https://r2/put',
        method: 'PUT',
        headers: {},
        expiresAt: 'x',
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: signResult }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();

    const data = await store
      .dispatch(
        mediaApi.endpoints.signUpload.initiate({
          filename: 'a1.png',
          contentType: 'image/png',
          size: 10,
        }),
      )
      .unwrap();

    expect(data).toEqual(signResult);
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.method).toBe('POST');
    expect(request.url).toContain('/media/uploads');
  });

  it('confirms an upload and publishes media.asset.uploaded (W4)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: asset }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();
    const events: string[] = [];
    const unsubscribe = eventBus.subscribe((event) => events.push(event.type));

    await store
      .dispatch(
        mediaApi.endpoints.confirmUpload.initiate({
          id: 'a1',
          body: { width: 10, height: 20 },
        }),
      )
      .unwrap();
    unsubscribe();

    expect(events).toContain('media.asset.uploaded');
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.url).toContain('/media/uploads/a1/confirm');
  });

  it('lists media serializing page/folder/type into the query string', async () => {
    const paginated: Paginated<MediaAsset> = {
      items: [asset],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: paginated }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();

    const data = await store
      .dispatch(
        mediaApi.endpoints.listMedia.initiate({
          page: 1,
          pageSize: 20,
          order: 'asc',
          folderId: 'f1',
          type: 'image',
        }),
      )
      .unwrap();

    expect(data.items).toHaveLength(1);
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.url).toContain('/media?');
    expect(request.url).toContain('folderId=f1');
    expect(request.url).toContain('type=image');
  });

  it('deletes media and publishes media.asset.deleted (W4)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: { id: 'a1' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();
    const events: string[] = [];
    const unsubscribe = eventBus.subscribe((event) => events.push(event.type));

    await store
      .dispatch(mediaApi.endpoints.deleteMedia.initiate('a1'))
      .unwrap();
    unsubscribe();

    expect(events).toContain('media.asset.deleted');
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.method).toBe('DELETE');
    expect(request.url).toContain('/media/a1');
  });

  it('creates and lists folders', async () => {
    const folder: MediaFolder = {
      id: 'f1',
      parentId: null,
      name: 'Logos',
      createdAt: 'x',
      updatedAt: 'x',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ success: true, message: 'ok', data: folder }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, message: 'ok', data: [folder] }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();

    const created = await store
      .dispatch(mediaApi.endpoints.createFolder.initiate({ name: 'Logos' }))
      .unwrap();
    expect(created).toEqual(folder);

    const listed = await store
      .dispatch(mediaApi.endpoints.listFolders.initiate())
      .unwrap();
    expect(listed).toEqual([folder]);
  });
});
