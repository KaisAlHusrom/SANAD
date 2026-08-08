import { vi } from 'vitest';

/** How the stubbed storage endpoint should answer the presigned PUT. */
export interface R2UploadOutcome {
  /** HTTP status to answer with. Default 200. */
  status?: number;
  /** Response body — S3/R2 return their errors as XML. */
  body?: string;
  /** Refuse the request the way a blocked CORS preflight does: no status ever reaches JS. */
  blocked?: boolean;
}

export interface StubbedR2Upload {
  /** The urls the stub was asked to PUT to, in order — lets a test assert the leg ran. */
  urls: string[];
}

/**
 * Stub the direct-to-R2 upload (test util).
 *
 * The presigned PUT is an `XMLHttpRequest`, not a `fetch`, because only XHR reports upload
 * progress (see `lib/put-to-r2.ts`). That means stubbing `fetch` — which every gateway-level
 * test does — does NOT intercept it, so any test that drives a full upload needs this too.
 */
export function stubR2Upload(outcome: R2UploadOutcome = {}): StubbedR2Upload {
  const record: StubbedR2Upload = { urls: [] };

  class StubXhr {
    status = 0;
    responseText = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
      onprogress: null,
    };

    private url = '';

    open(_method: string, url: string) {
      this.url = url;
    }

    setRequestHeader() {
      // presigned — nothing to assert here; `put-to-r2.spec` covers the headers themselves
    }

    send(body: unknown) {
      record.urls.push(this.url);
      // Answer on a microtask so the caller's promise settles like a real request would.
      queueMicrotask(() => {
        const total = body instanceof Blob ? body.size : 0;
        this.upload.onprogress?.({
          loaded: total,
          total,
          lengthComputable: true,
        } as ProgressEvent);
        if (outcome.blocked) {
          this.onerror?.();
          return;
        }
        this.status = outcome.status ?? 200;
        this.responseText = outcome.body ?? '';
        this.onload?.();
      });
    }
  }

  vi.stubGlobal('XMLHttpRequest', StubXhr);
  return record;
}
