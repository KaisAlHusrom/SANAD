import { S3Client } from '@aws-sdk/client-s3';
import type { ClientProxy } from '@nestjs/microservices';
import type { ResolvedIntegrationConfig } from '@sanad/contracts';
import { DateTimeService } from '@sanad/database';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MediaEnv } from '../../../env.js';
import { R2StorageProvider } from './r2-storage.provider.js';

/** A DateTimeService whose "now" the test advances, to exercise the credentials TTL. */
function makeClock() {
  const base = DateTimeService.fixed('2026-07-19T00:00:00.000Z').now();
  let extraMs = 0;
  const svc = new DateTimeService(() => base.plus({ milliseconds: extraMs }));
  return { svc, advance: (delta: number) => (extraMs += delta) };
}

/** A settings ClientProxy replying from a live ref, so a test can flip the config mid-run. */
function settingsClient(
  read: () => ResolvedIntegrationConfig | null,
): ClientProxy {
  return { send: () => of(read()) } as unknown as ClientProxy;
}

const R2_CONFIG: ResolvedIntegrationConfig = {
  provider: 'r2',
  values: {
    accountId: 'v-acct',
    accessKeyId: 'v-ak',
    secretAccessKey: 'v-sk',
    bucket: 'v-bucket',
    endpoint: 'https://v.r2',
    publicUrl: 'https://cdn.example',
  },
};

const EMPTY_ENV = {
  ADMIN_PUBLIC_ORIGINS: ['http://localhost:8190'],
} as MediaEnv;

describe('R2StorageProvider (active-provider resolve, TTL cache, no-restart)', () => {
  it('is unconfigured until credentials resolve; publicUrl stays tolerant', async () => {
    const { svc } = makeClock();
    const provider = new R2StorageProvider(
      EMPTY_ENV,
      settingsClient(() => null),
      svc,
    );
    await provider.refresh();
    expect(provider.isConfigured()).toBe(false);
    expect(provider.publicUrl('a/b.png')).toBe('a/b.png');
  });

  it('builds the client + public base once the active provider is configured', async () => {
    const { svc } = makeClock();
    const provider = new R2StorageProvider(
      EMPTY_ENV,
      settingsClient(() => R2_CONFIG),
      svc,
    );
    await provider.refresh();
    expect(provider.isConfigured()).toBe(true);
    expect(provider.publicUrl('a/b.png')).toBe('https://cdn.example/a/b.png');
  });

  it('picks up newly-configured credentials after the TTL — no restart', async () => {
    const { svc, advance } = makeClock();
    let config: ResolvedIntegrationConfig | null = null;
    const provider = new R2StorageProvider(
      EMPTY_ENV,
      settingsClient(() => config),
      svc,
    );
    await provider.refresh();
    expect(provider.isConfigured()).toBe(false);

    // owner configures the provider in Integrations
    config = R2_CONFIG;
    // within the TTL → still the cached (unconfigured) client
    await provider.refresh();
    expect(provider.isConfigured()).toBe(false);

    // past the TTL → re-resolves, rebuilds, now configured
    advance(60_000);
    await provider.refresh();
    expect(provider.isConfigured()).toBe(true);
    expect(provider.publicUrl('x.png')).toBe('https://cdn.example/x.png');
  });

  /**
   * Regression (2026-07-20, rules change-log): `@aws-sdk/client-s3` ≥3.1075 defaults
   * `requestChecksumCalculation:'WHEN_SUPPORTED'`, so `PutObjectCommand` registers the
   * flexible-checksums plugin and the presigner (which strips only `amz-sdk-*`) leaves
   * `x-amz-checksum-crc32` — computed over an EMPTY body — in the signed query string.
   * R2 then rejects the PUT once the real bytes arrive. The client must presign clean.
   */
  it('presigns WITHOUT flexible-checksum params (R2 would reject the real body)', async () => {
    const { svc } = makeClock();
    const provider = new R2StorageProvider(
      EMPTY_ENV,
      settingsClient(() => R2_CONFIG),
      svc,
    );
    await provider.refresh();

    const signed = await provider.signUpload({
      key: 'uploads/x/y.png',
      contentType: 'image/png',
    });

    expect(signed.url).not.toMatch(/x-amz-checksum-/i);
    expect(signed.url).not.toMatch(/x-amz-sdk-checksum-algorithm/i);
    expect(signed.headers['Content-Type']).toBe('image/png');
  });

  it('reports a clear failure when testing a provider with missing fields', async () => {
    const { svc } = makeClock();
    const provider = new R2StorageProvider(
      EMPTY_ENV,
      settingsClient(() => null),
      svc,
    );
    const result = await provider.testConnection('r2', 'en');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Required fields are missing/i);
  });

  it('answers in the caller’s locale — the message lives in the PAYLOAD (U24d)', async () => {
    const { svc } = makeClock();
    const provider = new R2StorageProvider(
      EMPTY_ENV,
      settingsClient(() => null),
      svc,
    );
    // The exact bug the owner reported: an Arabic portal got an English test result.
    const result = await provider.testConnection('r2', 'ar');
    expect(result.message).toBe('هناك حقول مطلوبة ناقصة — أكملها واحفظ أولاً.');
  });

  it('reports a reachable bucket in Arabic, and a vendor failure as ar line + raw detail (U24e)', async () => {
    const { svc } = makeClock();
    const provider = new R2StorageProvider(
      EMPTY_ENV,
      settingsClient(() => R2_CONFIG),
      svc,
    );

    vi.spyOn(S3Client.prototype, 'send').mockResolvedValue(undefined as never);
    const okResult = await provider.testConnection('r2', 'ar');
    expect(okResult.ok).toBe(true);
    expect(okResult.message).toContain('تم الاتصال بنجاح');
    expect(okResult.message).toContain(R2_CONFIG.values['bucket']);
    expect(okResult.detail).toBeUndefined();

    vi.spyOn(S3Client.prototype, 'send').mockRejectedValue(
      new Error('SignatureDoesNotMatch: the request signature is invalid'),
    );
    const failResult = await provider.testConnection('r2', 'ar');
    expect(failResult.ok).toBe(false);
    expect(failResult.message).toBe('فشل الاتصال بمساحة التخزين.');
    // The vendor's own words survive — muted, beside the Arabic line, never INSTEAD of it.
    expect(failResult.detail).toContain('SignatureDoesNotMatch');
    vi.restoreAllMocks();
  });
});

/**
 * The CORS surface (rules change-log 2026-07-20 — the owner's 403). Every state the admin card
 * must render gets a test, because a state we never produce is a state the UI can't be trusted
 * to handle (U23). `S3Client.prototype.send` is stubbed so no network is touched.
 */
describe('R2StorageProvider — browser-CORS self-check', () => {
  function providerWithSend(
    send: (command: object) => Promise<unknown>,
  ): R2StorageProvider {
    vi.spyOn(S3Client.prototype, 'send').mockImplementation(
      send as unknown as typeof S3Client.prototype.send,
    );
    const { svc } = makeClock();
    return new R2StorageProvider(
      EMPTY_ENV,
      settingsClient(() => R2_CONFIG),
      svc,
    );
  }

  afterEach(() => vi.restoreAllMocks());

  it('→ `unconfigured` (and still shows the policy) when no storage provider resolves', async () => {
    const { svc } = makeClock();
    const provider = new R2StorageProvider(
      EMPTY_ENV,
      settingsClient(() => null),
      svc,
    );
    const status = await provider.corsStatus('ar', 'r2');
    expect(status.state).toBe('unconfigured');
    expect(status.canApply).toBe(false);
    expect(status.requiredOrigins).toEqual(['http://localhost:8190']);
    // even here the owner gets the JSON to paste into the dashboard
    expect(status.policy).toHaveLength(1);
  });

  it('→ `missing` + applicable when the bucket has no CORS configuration (the 403 case)', async () => {
    const provider = providerWithSend(() => {
      const error = new Error('The CORS configuration does not exist');
      error.name = 'NoSuchCORSConfiguration';
      return Promise.reject(error);
    });
    const status = await provider.corsStatus('ar', 'r2');
    expect(status.state).toBe('missing');
    expect(status.canApply).toBe(true);
    expect(status.allowedOrigins).toEqual([]);
  });

  it('→ `ok` when the bucket already allows our origin to PUT', async () => {
    const provider = providerWithSend(() =>
      Promise.resolve({
        CORSRules: [
          {
            AllowedOrigins: ['http://localhost:8190'],
            AllowedMethods: ['PUT', 'GET'],
            AllowedHeaders: ['content-type'],
            ExposeHeaders: ['etag'],
            MaxAgeSeconds: 3600,
          },
        ],
      }),
    );
    const status = await provider.corsStatus('ar', 'r2');
    expect(status.state).toBe('ok');
    expect(status.allowedOrigins).toEqual(['http://localhost:8190']);
    expect(status.message).toBeNull();
  });

  it('→ `origin-not-allowed` and names the origins the bucket DOES allow', async () => {
    const provider = providerWithSend(() =>
      Promise.resolve({
        CORSRules: [
          {
            AllowedOrigins: ['https://other.example'],
            AllowedMethods: ['PUT'],
            AllowedHeaders: ['content-type'],
          },
        ],
      }),
    );
    const status = await provider.corsStatus('ar', 'r2');
    expect(status.state).toBe('origin-not-allowed');
    expect(status.allowedOrigins).toEqual(['https://other.example']);
  });

  it('→ `cannot-check` in the CALLER’S LANGUAGE, with AWS’s words kept in `detail` (U24d/e)', async () => {
    const provider = providerWithSend(() => {
      const error = new Error('Access Denied');
      error.name = 'AccessDenied';
      return Promise.reject(error);
    });
    const status = await provider.corsStatus('ar', 'r2');
    expect(status.state).toBe('cannot-check');
    // no button that would fail — the UI shows the manual instructions instead
    expect(status.canApply).toBe(false);
    // The owner's original complaint, one button over from "Test connection": this line used
    // to be raw AWS English on an Arabic screen.
    expect(status.message).toBe(
      'تعذّر قراءة إعدادات CORS للحاوية — الصلاحيات الحالية لا تسمح بذلك.',
    );
    expect(status.detail).toBe('Access Denied');

    const english = await providerWithSend(() => {
      const error = new Error('Access Denied');
      error.name = 'AccessDenied';
      return Promise.reject(error);
    }).corsStatus('en', 'r2');
    expect(english.message).toBe(
      "The bucket's CORS configuration could not be read — these credentials aren't allowed to.",
    );
    expect(english.detail).toBe('Access Denied');
  });

  it('applyCors writes the policy and returns the RE-READ status, not an assumed one', async () => {
    let written: unknown = null;
    const provider = providerWithSend((command) => {
      const name = command.constructor.name;
      if (name === 'PutBucketCorsCommand') {
        written = (command as { input: unknown }).input;
        return Promise.resolve({});
      }
      // the re-read after the write reflects what was written
      return Promise.resolve({
        CORSRules: [
          {
            AllowedOrigins: ['http://localhost:8190'],
            AllowedMethods: ['PUT'],
            AllowedHeaders: ['content-type'],
          },
        ],
      });
    });

    const status = await provider.applyCors('ar', 'r2');
    expect(written).not.toBeNull();
    expect(status.state).toBe('ok');
  });

  it('applyCors surfaces a refused write as `cannot-check` instead of throwing', async () => {
    const provider = providerWithSend((command) =>
      command.constructor.name === 'PutBucketCorsCommand'
        ? Promise.reject(new Error('Access Denied'))
        : Promise.resolve({ CORSRules: [] }),
    );
    const status = await provider.applyCors('ar', 'r2');
    expect(status.state).toBe('cannot-check');
    expect(status.canApply).toBe(false);
    // Localized sentence for the owner, AWS's own words kept beside it (U24d/e).
    expect(status.message).toBe('تعذّر تطبيق سياسة CORS على الحاوية.');
    expect(status.detail).toBe('Access Denied');
  });
});
