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

/**
 * A minimal stand-in for the browser's XMLHttpRequest. The upload uses XHR rather than `fetch`
 * because only XHR reports how many bytes have gone out — see `PutToR2Options.onProgress`.
 * `respond`/`fail` let each test drive the exact outcome it is about.
 */
class FakeXhr {
  static last: FakeXhr | null = null;

  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: unknown = null;
  status = 0;
  responseText = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
    onprogress: null,
  };

  constructor() {
    FakeXhr.last = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  send(body: unknown) {
    this.body = body;
  }

  /** Complete the request with a status (and optional body), as the network would. */
  respond(status: number, responseText = '') {
    this.status = status;
    this.responseText = responseText;
    this.onload?.();
  }

  /** The browser refusing the request outright — no status ever reaches JS. */
  fail() {
    this.onerror?.();
  }

  progress(loaded: number, total: number, lengthComputable = true) {
    this.upload.onprogress?.({
      loaded,
      total,
      lengthComputable,
    } as ProgressEvent);
  }
}

/** Start the PUT and hand back the in-flight fake so the test can drive it. */
function startUpload(options?: Parameters<typeof putToR2>[2]) {
  FakeXhr.last = null;
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
  const promise = putToR2(instruction, file, options);
  return { promise, xhr: FakeXhr.last as unknown as FakeXhr };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('putToR2 (direct-to-R2, bypasses baseQuery)', () => {
  it('PUTs the file with the presigned url/headers and NO auth header', async () => {
    const { promise, xhr } = startUpload();
    xhr.respond(200);
    await promise;

    expect(xhr.url).toBe(instruction.url);
    expect(xhr.method).toBe('PUT');
    expect(xhr.body).toBe(file);
    // the presign IS the auth — there must be NO Authorization header
    expect(JSON.stringify(xhr.headers)).not.toMatch(/authorization/i);
    expect(xhr.headers['content-type']).toBe('image/png');
  });

  it('reports upload progress while the bytes go out', async () => {
    const onProgress = vi.fn();
    const { promise, xhr } = startUpload({ onProgress });

    xhr.progress(512, 1024);
    xhr.respond(200);
    await promise;

    expect(onProgress).toHaveBeenCalledWith(512, 1024);
  });

  it('falls back to the file size when the length is not computable', async () => {
    const onProgress = vi.fn();
    const { promise, xhr } = startUpload({ onProgress });

    xhr.progress(2, 0, false);
    xhr.respond(200);
    await promise;

    expect(onProgress).toHaveBeenCalledWith(2, file.size);
  });

  it('throws UploadTransportError on a non-2xx response', async () => {
    const { promise, xhr } = startUpload();
    xhr.respond(403);
    await expect(promise).rejects.toBeInstanceOf(UploadTransportError);
  });

  /**
   * The failure the owner actually hit (rules change-log 2026-07-20). A failed CORS preflight
   * surfaces as a transport error with NO status — the browser withholds it by design — so this
   * used to escape as a bare error and be reported as "unknown".
   */
  it('classifies a browser-blocked request as CORS, not "unknown"', async () => {
    vi.stubGlobal('navigator', { onLine: true });
    const { promise, xhr } = startUpload();
    xhr.fail();

    await expect(promise).rejects.toMatchObject({
      name: 'UploadTransportError',
      kind: 'cors',
      status: 0,
    });
  });

  it('classifies the same failure as `network` when the browser reports being offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const { promise, xhr } = startUpload();
    xhr.fail();

    await expect(promise).rejects.toMatchObject({ kind: 'network' });
  });

  it('treats a status-0 "load" as CORS as well (the other shape of a block)', async () => {
    const { promise, xhr } = startUpload();
    xhr.respond(0);
    await expect(promise).rejects.toMatchObject({ kind: 'cors', status: 0 });
  });

  it("reads S3/R2's XML error body so a 403 becomes a named code", async () => {
    const { promise, xhr } = startUpload();
    xhr.respond(
      403,
      '<?xml version="1.0"?><Error><Code>SignatureDoesNotMatch</Code>' +
        '<Message>The request signature we calculated does not match</Message></Error>',
    );

    await expect(promise).rejects.toMatchObject({
      kind: 'http',
      status: 403,
      providerCode: 'SignatureDoesNotMatch',
    });
  });

  it('survives an unreadable error body — a bad body must not replace a useful error', async () => {
    const { promise, xhr } = startUpload();
    xhr.respond(500, 'not xml at all');

    const error = await promise.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(UploadTransportError);
    expect((error as UploadTransportError).providerCode).toBeNull();
    expect((error as UploadTransportError).status).toBe(500);
  });
});
