import { ServiceUnavailableException } from '@nestjs/common';
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

  constructor(options: FakeStorageOptions = {}) {
    super();
    this.configured = options.configured ?? true;
    this.publicBase = (options.publicBase ?? 'https://cdn.test').replace(
      /\/+$/,
      '',
    );
  }

  isConfigured(): boolean {
    return this.configured;
  }

  assertConfigured(): void {
    if (!this.configured) {
      throw new ServiceUnavailableException('Media storage is not configured.');
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
}
