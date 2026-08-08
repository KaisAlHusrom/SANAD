import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { DateTimeService } from '@sanad/database';
import { MediaAssetRepository } from '../infrastructure/persistence/media-asset.repository.js';
import {
  PENDING_SWEEP_INTERVAL_MS,
  PENDING_UPLOAD_GRACE_MS,
} from './media.constants.js';

/**
 * Removes the wreckage of uploads that never completed.
 *
 * An upload writes its `media_asset` row at SIGN time and only becomes `ready` at CONFIRM time,
 * so any upload that dies in between (a blocked CORS preflight, a closed tab, a dropped
 * connection) leaves a `pending` row behind. Those rows are invisible in the library, reference
 * bytes that never landed in storage, and accumulate forever — the owner's two failed uploads on
 * 2026-07-20 left exactly two of them.
 *
 * Once the presigned URL has expired, such a row can NEVER become `ready` — the signature it was
 * minted for is dead — so it is not "an upload in progress", it is garbage, and it is deleted
 * outright (there is nothing in storage to reconcile). A generous grace period on top of the URL
 * lifetime keeps a slow-but-live upload safe.
 */
@Injectable()
export class PendingUploadSweeperService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(PendingUploadSweeperService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly assets: MediaAssetRepository,
    private readonly clock: DateTimeService,
  ) {}

  onApplicationBootstrap(): void {
    // Sweep once at boot (a crash mid-upload leaves rows that outlive the process), then
    // periodically. `unref` so the interval never holds the process open on shutdown (MS8).
    void this.sweep();
    this.timer = setInterval(
      () => void this.sweep(),
      PENDING_SWEEP_INTERVAL_MS,
    );
    this.timer.unref?.();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Delete every `pending` row older than the signed-URL lifetime + grace. Never throws. */
  async sweep(): Promise<number> {
    const cutoff = this.clock
      .now()
      .minus({ milliseconds: PENDING_UPLOAD_GRACE_MS })
      .toJSDate();
    try {
      const removed = await this.assets.purgeExpiredPending(cutoff);
      if (removed > 0) {
        this.logger.log(`Swept ${removed} expired pending upload(s)`);
      }
      return removed;
    } catch (error) {
      // A failed sweep is housekeeping, not a request — log it and let the next tick retry
      // rather than take the service down (U23b: handled, not swallowed).
      this.logger.warn(
        `Pending-upload sweep failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return 0;
    }
  }
}
