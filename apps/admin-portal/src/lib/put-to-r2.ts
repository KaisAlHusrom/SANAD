import type { UploadInstruction } from '@sanad/contracts';

/**
 * Why the direct-to-storage PUT can fail, in the terms the USER needs — not an HTTP status.
 *
 * - `cors` — the browser refused/aborted the request itself. The bucket has no CORS rule for our
 *   origin, so the preflight was rejected and JS never sees a status (a rejected request, not a
 *   403 response). This is the exact failure the owner hit; it has a one-click fix in
 *   Integrations → Storage, so it MUST be named rather than lumped into "unknown" (U23c).
 * - `network` — offline / DNS / the request was cut mid-flight.
 * - `http` — storage answered with a status; `status` and, where readable, the provider's own
 *   `<Code>`/`<Message>` from the XML body are carried along.
 */
export type UploadTransportKind = 'cors' | 'network' | 'http';

/** A failed direct-to-R2 PUT (transport/storage error — distinct from a gateway ApiError). */
export class UploadTransportError extends Error {
  constructor(
    public readonly kind: UploadTransportKind,
    /** 0 when the browser never got a response (cors/network). */
    public readonly status: number,
    /** The provider's error code (`SignatureDoesNotMatch`, `AccessDenied`…), when readable. */
    public readonly providerCode: string | null = null,
    /** The provider's error message, when readable. */
    public readonly providerMessage: string | null = null,
  ) {
    super(`Upload failed (${kind}${status ? ` ${status}` : ''})`);
    this.name = 'UploadTransportError';
  }
}

export interface PutToR2Options {
  /**
   * Bytes sent so far, out of the total. Called repeatedly while the body streams — this is the
   * reason the request is an `XMLHttpRequest` and not a `fetch`: `fetch` has no way to observe
   * upload progress, so a large image looked frozen for the whole upload (U23a — "in progress"
   * is a state, and it has to be legible).
   */
  onProgress?: (loaded: number, total: number) => void;
}

/**
 * PUT the file bytes directly to R2 using the presigned instruction. This MUST bypass the
 * gateway/`baseQueryWithAuth` — it goes straight to R2 with NO bearer token (the presign IS the
 * auth) and expects NO `{success,message,data}` envelope.
 *
 * Every failure mode is classified before it leaves this function, because a raw transport error
 * from a browser-blocked request is indistinguishable from "something went wrong" by the time it
 * reaches a component — and that is precisely how a blocked upload became a silent no-op
 * (rules change-log 2026-07-20).
 */
export function putToR2(
  instruction: UploadInstruction,
  file: File,
  options: PutToR2Options = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(instruction.method, instruction.url, true);
    for (const [name, value] of Object.entries(instruction.headers)) {
      request.setRequestHeader(name, value);
    }

    request.upload.onprogress = (event: ProgressEvent) => {
      // A body of unknown length can't be a percentage; report the total we know from the File
      // rather than inventing one, and let the caller show an indeterminate bar.
      options.onProgress?.(
        event.loaded,
        event.lengthComputable ? event.total : file.size,
      );
    };

    request.onerror = () => {
      // The browser blocked the request outright: a failed CORS preflight, or no network at all.
      // We cannot read a status — the browser withholds it by design — so distinguish by
      // connectivity, the one signal available, and default to the far likelier cause when online.
      reject(
        new UploadTransportError(
          navigator.onLine === false ? 'network' : 'cors',
          0,
          null,
          null,
        ),
      );
    };

    request.onload = () => {
      // Status 0 with a "successful" load is the other shape a CORS block takes.
      if (request.status === 0) {
        reject(new UploadTransportError('cors', 0));
        return;
      }
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      const { code, message } = readProviderError(request);
      reject(new UploadTransportError('http', request.status, code, message));
    };

    request.send(file);
  });
}

/**
 * S3/R2 answer errors as an XML document (`<Error><Code>…</Code><Message>…</Message></Error>`).
 * Reading it turns "403" into "AccessDenied" or "SignatureDoesNotMatch" — the difference between
 * a user guessing and a user knowing. Parsed defensively: a body we can't read must never turn a
 * useful error into a thrown one.
 */
function readProviderError(request: XMLHttpRequest): {
  code: string | null;
  message: string | null;
} {
  try {
    const body = request.responseText;
    return { code: matchTag(body, 'Code'), message: matchTag(body, 'Message') };
  } catch {
    return { code: null, message: null };
  }
}

function matchTag(body: string, tag: string): string | null {
  const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(body);
  return match?.[1]?.trim() || null;
}
