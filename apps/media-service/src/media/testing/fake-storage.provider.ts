import type { Locale, StorageCorsStatus } from '@sanad/contracts';
import { storageUnavailable } from '../application/media-errors.js';
import { buildCorsPolicy } from '../infrastructure/storage/cors-policy.js';
import {
  StorageProvider,
  type HeadResult,
  type SignedUpload,
  type SignUploadInput,
} from '../infrastructure/storage/storage.provider.js';

/** Options to construct the in-memory storage fake. */
export interface FakeStorageOptions {
  configured?: boolean;
  publicBase?: string;
  /** Origins the in-memory bucket CORS check judges against. */
  corsOrigins?: string[];
  /** Start with the CORS policy already written (default: not written → `missing`). */
  corsApplied?: boolean;
}

/**
 * In-memory `StorageProvider` for tests — no network, no AWS SDK. Tests pre-seed
 * `objects` to simulate a completed direct-to-R2 upload before calling confirm. Lives
 * under `testing/` (not the storage barrel) so it never wires into production.
 */
export class FakeStorageProvider extends StorageProvider {
  readonly objects = new Map<string, HeadResult>();
  private readonly configured: boolean;
  private readonly publicBase: string;
  private readonly corsOrigins: string[];
  private corsApplied: boolean;

  constructor(options: FakeStorageOptions = {}) {
    super();
    this.configured = options.configured ?? true;
    this.publicBase = (options.publicBase ?? 'https://cdn.test').replace(
      /\/+$/,
      '',
    );
    this.corsOrigins = options.corsOrigins ?? ['http://localhost:8190'];
    this.corsApplied = options.corsApplied ?? false;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  assertConfigured(): void {
    if (!this.configured) {
      throw storageUnavailable();
    }
  }

  signUpload(input: SignUploadInput): Promise<SignedUpload> {
    this.assertConfigured();
    return Promise.resolve({
      url: `${this.publicBase}/__upload__/${input.key}`,
      headers: { 'Content-Type': input.contentType },
      expiresInSeconds: 900,
    });
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }

  delete(key: string): Promise<void> {
    this.assertConfigured();
    this.objects.delete(key);
    return Promise.resolve();
  }

  head(key: string): Promise<HeadResult | null> {
    return Promise.resolve(this.objects.get(key) ?? null);
  }

  /**
   * In-memory bucket CORS: starts `missing`, becomes `ok` once `applyCors` writes the policy.
   * Keeps the base signature (locale first) so a test can assert the forwarded locale (U24d),
   * even though the fake's states need no prose.
   */
  override corsStatus(_locale: Locale): Promise<StorageCorsStatus> {
    return Promise.resolve(this.buildCorsStatus());
  }

  override applyCors(_locale: Locale): Promise<StorageCorsStatus> {
    this.corsApplied = true;
    return Promise.resolve(this.buildCorsStatus());
  }

  private buildCorsStatus(): StorageCorsStatus {
    const requiredOrigins = [...this.corsOrigins];
    return {
      state: this.configured
        ? this.corsApplied
          ? 'ok'
          : 'missing'
        : 'unconfigured',
      requiredOrigins,
      allowedOrigins: this.corsApplied ? requiredOrigins : [],
      canApply: this.configured,
      message: null,
      detail: null,
      policy: buildCorsPolicy(requiredOrigins),
    };
  }
}
