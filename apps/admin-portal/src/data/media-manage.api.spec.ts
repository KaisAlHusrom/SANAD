import { configureStore } from '@reduxjs/toolkit';
import type {
  MediaAsset,
  MediaFolder,
  UploadSignResult,
} from '@sanad/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authReducer } from './auth/auth.slice';
import { eventBus } from './events/event-bus';
import { mediaManageApi } from './media-manage.api';

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [mediaManageApi.reducerPath]: mediaManageApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(mediaManageApi.middleware),
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

describe('mediaManageApi (shared write bridge, W5)', () => {
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
        mediaManageApi.endpoints.signUpload.initiate({
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
        mediaManageApi.endpoints.confirmUpload.initiate({
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

  it('creates a folder and publishes media.folder.created (W4)', async () => {
    const folder: MediaFolder = {
      id: 'f1',
      parentId: null,
      name: 'Logos',
      createdAt: 'x',
      updatedAt: 'x',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: folder }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();
    const events: { type: string; folderId?: string }[] = [];
    const unsubscribe = eventBus.subscribe((event) =>
      events.push(event as { type: string; folderId?: string }),
    );

    const created = await store
      .dispatch(
        mediaManageApi.endpoints.createFolder.initiate({ name: 'Logos' }),
      )
      .unwrap();
    unsubscribe();

    expect(created).toEqual(folder);
    expect(events).toContainEqual({
      type: 'media.folder.created',
      folderId: 'f1',
    });
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.method).toBe('POST');
    expect(request.url).toContain('/media/folders');
  });
});
