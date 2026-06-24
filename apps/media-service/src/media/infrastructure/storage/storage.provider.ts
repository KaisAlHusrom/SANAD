/** Resolved Cloudflare R2 (S3-compatible) credentials + addressing. */
export interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
  publicUrl: string;
}

/** Input to mint a presigned PUT URL. */
export interface SignUploadInput {
  key: string;
  contentType: string;
}

/** A minted presigned upload — clock-free; the service stamps `expiresAt` (N3). */
export interface SignedUpload {
  url: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
}

/** Object metadata read back from storage after an upload. */
export interface HeadResult {
  size: number;
  contentType: string;
}

/**
 * The storage boundary (the ONLY place the S3 SDK is touched) — an abstract class so it
 * doubles as a Nest DI token (N11 seam) and is trivially faked in tests. When R2 isn't
 * configured the provider is unconfigured and mutating ops surface a clean 503
 * (`assertConfigured`), so the service still boots without creds.
 */
export abstract class StorageProvider {
  /** Whether R2 credentials are present and a client was built. */
  abstract isConfigured(): boolean;
  /** Throw `ServiceUnavailableException` (503) if storage isn't configured. */
  abstract assertConfigured(): void;
  /** Mint a presigned PUT URL the client uploads bytes to directly. */
  abstract signUpload(input: SignUploadInput): Promise<SignedUpload>;
  /** The stable public CDN URL for a stored object key (tolerant when unconfigured). */
  abstract publicUrl(key: string): string;
  /** Delete an object by key (best-effort cleanup after a soft-delete). */
  abstract delete(key: string): Promise<void>;
  /** Read object metadata (size/content-type), or null if absent/unreadable. */
  abstract head(key: string): Promise<HeadResult | null>;
}
