import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MEDIA_ENV, type MediaEnv } from '../../../env.js';
import { getStorageCredentials } from './storage-credentials.js';
import { R2_REGION, SIGNED_UPLOAD_TTL_SECONDS } from './storage.constants.js';
import {
  StorageProvider,
  type HeadResult,
  type SignedUpload,
  type SignUploadInput,
} from './storage.provider.js';

/**
 * The single boundary touching `@aws-sdk/client-s3` (P4, OPS3) — Cloudflare R2 over the
 * S3 API. Credentials come from the `getStorageCredentials` seam (env now, vault later).
 * When unconfigured the client is null and mutating ops surface a clean 503 (the service
 * still boots); `publicUrl` stays tolerant so listing works regardless.
 */
@Injectable()
export class R2StorageProvider extends StorageProvider {
  private readonly client: S3Client | null;
  private readonly bucket: string | null;
  private readonly publicBase: string | null;

  constructor(@Inject(MEDIA_ENV) env: MediaEnv) {
    super();
    const creds = getStorageCredentials(env);
    if (creds) {
      this.client = new S3Client({
        region: R2_REGION,
        endpoint: creds.endpoint,
        credentials: {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
        },
      });
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

  private require(): { client: S3Client; bucket: string } {
    if (!this.client || !this.bucket) {
      throw this.unconfigured();
    }
    return { client: this.client, bucket: this.bucket };
  }

  private unconfigured(): ServiceUnavailableException {
    return new ServiceUnavailableException(
      'Media storage is not configured on this deployment (missing R2_* env).',
    );
  }
}
