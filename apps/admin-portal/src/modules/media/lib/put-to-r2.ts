import type { UploadInstruction } from '@sanad/contracts';

/** A failed direct-to-R2 PUT (transport/storage error — distinct from a gateway ApiError). */
export class UploadTransportError extends Error {
  constructor(public readonly status: number) {
    super(`Upload failed (${status})`);
    this.name = 'UploadTransportError';
  }
}

/**
 * PUT the file bytes directly to R2 using the presigned instruction. This MUST bypass the
 * gateway/`baseQueryWithAuth` — it goes straight to R2 with NO bearer token (the presign
 * IS the auth) and expects NO `{success,message,data}` envelope. A non-2xx is a raw
 * transport/R2 failure surfaced as `UploadTransportError`.
 */
export async function putToR2(
  instruction: UploadInstruction,
  file: File,
): Promise<void> {
  const response = await fetch(instruction.url, {
    method: instruction.method,
    headers: instruction.headers,
    body: file,
  });
  if (!response.ok) {
    throw new UploadTransportError(response.status);
  }
}
