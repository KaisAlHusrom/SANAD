import type {
  IntegrationProviderId,
  IntegrationTestResult,
  Locale,
  StorageCorsStatus,
} from '@sanad/contracts';
import { translate } from '@sanad/i18n';

/** The CORS answer for a provider that doesn't implement bucket-config inspection. */
function unsupportedCors(locale: Locale): StorageCorsStatus {
  return {
    state: 'cannot-check',
    requiredOrigins: [],
    allowedOrigins: [],
    canApply: false,
    message: translate('media.cors.unsupported', locale),
    detail: null,
    policy: [],
  };
}

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
  /**
   * Re-resolve credentials from their source (vault → env) when the cache has expired, and
   * rebuild the underlying client if they changed. A no-op for providers whose creds are fixed;
   * the R2 provider overrides it so the owner can (re)configure storage from the admin without a
   * restart. Callers `await` this before a sync `isConfigured()`/`publicUrl()` so those read
   * fresh state.
   */
  async refresh(): Promise<void> {
    /* fixed-credential providers need no refresh */
  }

  /**
   * Prove a specific provider's credentials with a real round-trip, WITHOUT activating it or
   * disturbing the live client — backs the admin's "Test connection". Defaults to "not
   * supported" so a fake/simple provider needn't implement it.
   *
   * The result's `message` sits INSIDE the payload, so the gateway's envelope renderer never
   * sees it — the service localizes it here, from the forwarded caller locale (U24d).
   */
  async testConnection(
    _provider: IntegrationProviderId,
    locale: Locale,
  ): Promise<IntegrationTestResult> {
    return {
      ok: false,
      message: translate('settings.test.unsupported', locale),
    };
  }

  /**
   * Inspect the bucket's **browser CORS** policy — independent of `testConnection`, because the
   * two fail independently: credentials can be perfect while every browser upload still 403s in
   * preflight for want of a CORS rule (rules change-log 2026-07-20). Never throws — an
   * unreadable config is the `cannot-check` state, which the admin renders with the manual
   * instructions (U23).
   */
  async corsStatus(
    locale: Locale,
    _provider?: IntegrationProviderId,
  ): Promise<StorageCorsStatus> {
    return unsupportedCors(locale);
  }

  /**
   * Write the policy that unblocks browser uploads, and return the re-checked status. Also
   * never throws: a refusal (an object-scoped token that may not touch bucket config) comes
   * back as `cannot-check` + a LOCALIZED message with the provider's verbatim words in `detail`
   * (U24d/e) — so the UI can fall back to "copy this JSON into the Cloudflare dashboard"
   * instead of a dead end.
   */
  async applyCors(
    locale: Locale,
    _provider?: IntegrationProviderId,
  ): Promise<StorageCorsStatus> {
    return unsupportedCors(locale);
  }

  /** Whether R2 credentials are present and a client was built. */
  abstract isConfigured(): boolean;
  /** Throw the keyed 503 `storageUnavailable()` if storage isn't configured (U24). */
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
