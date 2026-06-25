import type { UploadInstruction } from '@sanad/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { putToR2, UploadTransportError } from './put-to-r2';

const instruction: UploadInstruction = {
  url: 'https://r2.example.com/bucket/key?signature=abc',
  method: 'PUT',
  headers: { 'content-type': 'image/png' },
  expiresAt: '2026-06-25T01:00:00.000Z',
};

const file = new File([new Uint8Array([1, 2, 3])], 'logo.png', {
  type: 'image/png',
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('putToR2 (direct-to-R2, bypasses baseQuery)', () => {
  it('PUTs the file with the presigned url/headers and NO auth header', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await putToR2(instruction, file);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(instruction.url);
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(file);
    // the presign IS the auth — there must be NO Authorization header
    expect(JSON.stringify(init.headers ?? {})).not.toMatch(/authorization/i);
  });

  it('throws UploadTransportError on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 403 })),
    );

    await expect(putToR2(instruction, file)).rejects.toBeInstanceOf(
      UploadTransportError,
    );
  });
});
