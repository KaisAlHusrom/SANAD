import {
  DeleteObjectCommand,
  GetBucketCorsCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
  type CORSRule,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import type { RpcException } from '@nestjs/microservices';
import { DateTimeService } from '@sanad/database';
import { isSignedOnlyPublicUrl } from '@sanad/contracts';
import type {
  IntegrationProviderId,
  IntegrationTestResult,
  Locale,
  StorageCorsRule,
  StorageCorsStatus,
} from '@sanad/contracts';
import { translate } from '@sanad/i18n';
import { SETTINGS_CLIENT } from '../../../core/injection-tokens.js';
import { storageUnavailable } from '../../application/media-errors.js';
import { MEDIA_ENV, type MediaEnv } from '../../../env.js';
import { buildCorsPolicy, evaluateCorsRules } from './cors-policy.js';
import { resolveActiveStorageConfig } from './storage-credentials.js';
import type { ResolvedStorage } from './storage-credentials.js';
import {
  R2_REGION,
  SIGNED_UPLOAD_TTL_SECONDS,
  STORAGE_CREDENTIALS_TTL_MS,
} from './storage.constants.js';
import {
  StorageProvider,
  type HeadResult,
  type R2Credentials,
  type SignedUpload,
  type SignUploadInput,
} from './storage.provider.js';

/**
 * The single boundary touching `@aws-sdk/client-s3` (P4, OPS3) — Cloudflare R2 over the
 * S3 API. Credentials resolve **vault → env** through the `resolveStorageCredentials` seam and
 * are cached for {@link STORAGE_CREDENTIALS_TTL_MS} — so the owner can (re)configure R2 from the
 * Integrations page and it takes effect within the TTL, no restart. `refresh()` re-resolves when
 * the cache expires and rebuilds the client only when the credentials actually changed. When
 * unconfigured the client is null and mutating ops surface a clean 503 (the service still boots);
 * `publicUrl` stays tolerant so listing works regardless.
 */
@Injectable()
export class R2StorageProvider extends StorageProvider {
  private client: S3Client | null = null;
  private bucket: string | null = null;
  private publicBase: string | null = null;
  /** Fingerprint of the last-applied credentials (`null` = never resolved; `''` = unconfigured). */
  private fingerprint: string | null = null;
  private nextRefreshAtMs = 0;

  constructor(
    @Inject(MEDIA_ENV) private readonly env: MediaEnv,
    @Inject(SETTINGS_CLIENT) private readonly settingsClient: ClientProxy,
    private readonly clock: DateTimeService,
  ) {
    super();
  }

  override async refresh(): Promise<void> {
    const nowMs = this.clock.nowMillis();
    // Within the TTL after a prior resolve → keep the cached client (read path stays off RMQ).
    if (this.fingerprint !== null && nowMs < this.nextRefreshAtMs) {
      return;
    }
    const resolved = await resolveActiveStorageConfig(
      this.settingsClient,
      this.env,
    );
    const creds = resolved?.credentials ?? null;
    this.nextRefreshAtMs = nowMs + STORAGE_CREDENTIALS_TTL_MS;
    // The provider id is part of the identity: switching provider MUST rebuild the client
    // even if two providers happened to share credentials.
    const next = resolved ? fingerprintOf(resolved) : '';
    if (next === this.fingerprint) {
      return; // unchanged — do not rebuild the client
    }
    this.fingerprint = next;
    if (creds) {
      this.client = buildS3Client(creds);
      this.bucket = creds.bucket;
      this.publicBase = creds.publicUrl.replace(/\/+$/, '');
    } else {
      this.client = null;
      this.bucket = null;
      this.publicBase = null;
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  assertConfigured(): void {
    if (!this.client) {
      throw this.unconfigured();
    }
  }

  async signUpload(input: SignUploadInput): Promise<SignedUpload> {
    const { client, bucket } = this.require();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      ContentType: input.contentType,
    });
    const url = await getSignedUrl(client, command, {
      expiresIn: SIGNED_UPLOAD_TTL_SECONDS,
    });
    return {
      url,
      headers: { 'Content-Type': input.contentType },
      expiresInSeconds: SIGNED_UPLOAD_TTL_SECONDS,
    };
  }

  publicUrl(key: string): string {
    return this.publicBase ? `${this.publicBase}/${key}` : key;
  }

  async delete(key: string): Promise<void> {
    const { client, bucket } = this.require();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async head(key: string): Promise<HeadResult | null> {
    const { client, bucket } = this.require();
    try {
      const result = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return {
        size: Number(result.ContentLength ?? 0),
        contentType: result.ContentType ?? '',
      };
    } catch {
      return null;
    }
  }

  /**
   * Prove a provider's credentials with a real round-trip (`HeadBucket`) BEFORE the owner
   * activates it — resolves that specific provider (not the active one) and builds a throwaway
   * client, so testing never disturbs the live one.
   *
   * The message is rendered HERE, in the caller's locale (U24d) — it travels inside the payload,
   * where the gateway's envelope renderer can't reach it. A vendor failure keeps its raw SDK text
   * in `detail` under the localized line, because "which key is wrong" is exactly what the owner
   * needs and AWS only says it in English (U24e).
   */
  override async testConnection(
    provider: IntegrationProviderId,
    locale: Locale,
  ): Promise<IntegrationTestResult> {
    const resolved = await resolveActiveStorageConfig(
      this.settingsClient,
      this.env,
      provider,
    );
    if (!resolved) {
      return {
        ok: false,
        message: translate('media.test.missingFields', locale),
      };
    }
    const creds = resolved.credentials;
    const probe = buildS3Client(creds);
    try {
      await probe.send(new HeadBucketCommand({ Bucket: creds.bucket }));
      // Reachable ≠ usable: a public base pointing at the SIGNED API host uploads fine and then
      // 403s every rendered <img>. Report it here rather than let it surface days later on the
      // website (U23 — a degraded state is a state, and it gets said out loud).
      if (isSignedOnlyPublicUrl(creds.publicUrl, creds.endpoint)) {
        return {
          ok: false,
          message: translate('media.test.signedOnlyPublicUrl', locale, {
            bucket: creds.bucket,
          }),
        };
      }
      return {
        ok: true,
        message: translate('media.test.reachable', locale, {
          bucket: creds.bucket,
        }),
      };
    } catch (error) {
      return {
        ok: false,
        message: translate('media.test.failed', locale),
        ...(error instanceof Error && error.message
          ? { detail: error.message }
          : {}),
      };
    } finally {
      probe.destroy();
    }
  }

  /**
   * Read the bucket's CORS rules and judge them against the origins the admin portal is served
   * from. Resolves the named provider (or the active one) into a throwaway client, exactly like
   * `testConnection`, so checking never disturbs the live client.
   *
   * The interesting case is the `catch`: R2 answers `NoSuchCORSConfiguration` when the bucket
   * simply has none (→ `missing`, the state that produced the owner's 403) but `AccessDenied`
   * when the API token is object-scoped and may not read bucket config (→ `cannot-check`, and
   * `canApply:false` because the write would fail the same way). Distinguishing them is the
   * difference between offering a working button and offering a lie (U23).
   */
  override async corsStatus(
    locale: Locale,
    provider?: IntegrationProviderId,
  ): Promise<StorageCorsStatus> {
    const context = await this.corsContext(provider);
    if (!context) return this.unconfiguredCors(locale);
    const { probe, creds, requiredOrigins, policy } = context;
    try {
      const result = await probe.send(
        new GetBucketCorsCommand({ Bucket: creds.bucket }),
      );
      const rules = (result.CORSRules ?? []).map(fromSdkRule);
      const evaluation = evaluateCorsRules(rules, requiredOrigins);
      return {
        state: evaluation.state,
        requiredOrigins,
        allowedOrigins: evaluation.allowedOrigins,
        canApply: true,
        message: null,
        detail: null,
        policy,
      };
    } catch (error) {
      if (isNoSuchCorsConfiguration(error)) {
        return {
          state: 'missing',
          requiredOrigins,
          allowedOrigins: [],
          canApply: true,
          message: null,
          detail: null,
          policy,
        };
      }
      // The token may not READ bucket config. Say so in the owner's language, and keep AWS's
      // own words in `detail` — they name the credential at fault (U24d/e).
      return {
        state: 'cannot-check',
        requiredOrigins,
        allowedOrigins: [],
        canApply: false,
        message: translate('media.cors.cannotCheck', locale),
        detail: detailOf(error),
        policy,
      };
    } finally {
      probe.destroy();
    }
  }

  /** Write the policy, then re-read it so the returned status is observed, not assumed. */
  override async applyCors(
    locale: Locale,
    provider?: IntegrationProviderId,
  ): Promise<StorageCorsStatus> {
    const context = await this.corsContext(provider);
    if (!context) return this.unconfiguredCors(locale);
    const { probe, creds, requiredOrigins, policy } = context;
    try {
      await probe.send(
        new PutBucketCorsCommand({
          Bucket: creds.bucket,
          CORSConfiguration: { CORSRules: policy.map(toSdkRule) },
        }),
      );
    } catch (error) {
      return {
        state: 'cannot-check',
        requiredOrigins,
        allowedOrigins: [],
        canApply: false,
        message: translate('media.cors.applyFailed', locale),
        detail: detailOf(error),
        policy,
      };
    } finally {
      probe.destroy();
    }
    return this.corsStatus(locale, provider);
  }

  /** Shared setup for both CORS ops — null when no provider config resolves. */
  private async corsContext(provider?: IntegrationProviderId): Promise<{
    probe: S3Client;
    creds: R2Credentials;
    requiredOrigins: string[];
    policy: StorageCorsRule[];
  } | null> {
    const resolved = await resolveActiveStorageConfig(
      this.settingsClient,
      this.env,
      provider,
    );
    if (!resolved) return null;
    const requiredOrigins = this.env.ADMIN_PUBLIC_ORIGINS;
    return {
      probe: buildS3Client(resolved.credentials),
      creds: resolved.credentials,
      requiredOrigins,
      policy: buildCorsPolicy(requiredOrigins),
    };
  }

  /** Storage isn't configured at all — nothing to check, and the policy is still worth showing. */
  private unconfiguredCors(locale: Locale): StorageCorsStatus {
    const requiredOrigins = this.env.ADMIN_PUBLIC_ORIGINS;
    return {
      state: 'unconfigured',
      requiredOrigins,
      allowedOrigins: [],
      canApply: false,
      message: translate('media.cors.unconfigured', locale),
      detail: null,
      policy: buildCorsPolicy(requiredOrigins),
    };
  }

  private require(): { client: S3Client; bucket: string } {
    if (!this.client || !this.bucket) {
      throw this.unconfigured();
    }
    return { client: this.client, bucket: this.bucket };
  }

  private unconfigured(): RpcException {
    return storageUnavailable();
  }
}

/**
 * THE one place an `S3Client` is constructed (live client + the `testConnection` probe), so the
 * R2-specific defaults can never drift apart.
 *
 * `requestChecksumCalculation: 'WHEN_REQUIRED'` is load-bearing, not a tuning knob (rules
 * change-log 2026-07-20): the SDK's default `WHEN_SUPPORTED` makes `PutObjectCommand` register
 * the flexible-checksums plugin, and `getSignedUrl` strips only the `amz-sdk-*` headers — so the
 * presigned URL ships `x-amz-checksum-crc32` computed over an **empty** body. The browser then
 * PUTs the real bytes and R2 rejects them for failing that checksum. `WHEN_REQUIRED` keeps the
 * presigned URL clean. Response validation is disabled for symmetry (R2 doesn't return them).
 */
function buildS3Client(creds: R2Credentials): S3Client {
  return new S3Client({
    region: R2_REGION,
    endpoint: creds.endpoint,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

/** Our contract rule → the SDK's `CORSRule`. */
function toSdkRule(rule: StorageCorsRule): CORSRule {
  return {
    AllowedOrigins: rule.allowedOrigins,
    AllowedMethods: rule.allowedMethods,
    AllowedHeaders: rule.allowedHeaders,
    ExposeHeaders: rule.exposeHeaders,
    ...(rule.maxAgeSeconds === null
      ? {}
      : { MaxAgeSeconds: rule.maxAgeSeconds }),
  };
}

/** The SDK's `CORSRule` → our contract rule (every list defaults to empty, never undefined). */
function fromSdkRule(rule: CORSRule): StorageCorsRule {
  return {
    allowedOrigins: rule.AllowedOrigins ?? [],
    allowedMethods: rule.AllowedMethods ?? [],
    allowedHeaders: rule.AllowedHeaders ?? [],
    exposeHeaders: rule.ExposeHeaders ?? [],
    maxAgeSeconds: rule.MaxAgeSeconds ?? null,
  };
}

/**
 * "The bucket has no CORS configuration" (→ `missing`, fixable by us) versus any other failure
 * (→ `cannot-check`, e.g. an object-scoped token that may not read bucket config). S3/R2 signal
 * the former with the `NoSuchCORSConfiguration` code; some stacks only put it in the message,
 * so both are checked.
 */
function isNoSuchCorsConfiguration(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'name' in error
      ? String((error as { name: unknown }).name)
      : '';
  return (
    /NoSuchCORSConfiguration/i.test(code) ||
    /NoSuchCORSConfiguration/i.test(detailOf(error) ?? '')
  );
}

/**
 * The provider's own words, for the `detail` line only (U24e) — never for `message`, which is
 * localized. `null` when the SDK gave us nothing quotable, so the UI renders no empty second line.
 */
function detailOf(error: unknown): string | null {
  return error instanceof Error && error.message ? error.message : null;
}

/**
 * A stable identity for a resolved provider — so `refresh()` rebuilds the client only on a real
 * change. The provider id is included so switching provider always rebuilds.
 */
function fingerprintOf(resolved: ResolvedStorage): string {
  const { provider, credentials } = resolved;
  return [
    provider,
    credentials.endpoint,
    credentials.accessKeyId,
    credentials.secretAccessKey,
    credentials.bucket,
    credentials.publicUrl,
  ].join('|');
}
