import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  DEFAULT_TRACKING_CONFIG,
  SETTINGS_RESOLVE_GROUP,
  TRACKING_GROUP,
  type Locale,
  type PublicTrackingConfig,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import { SETTINGS_CLIENT } from '../core/injection-tokens.js';
import {
  toPublicTrackingConfig,
  type ResolvedGroup,
} from './tracking-config/index.js';

/**
 * Far below `sendRequest`'s 5 s default, and deliberately so. The runtime gate measured the
 * unreachable-settings path at **5.05 s**: the endpoint degraded open, but only after the full
 * RMQ budget — on a **public route that every page render reads**, which would put five seconds
 * on every cold render during a settings outage. A consent policy is not worth that: if settings
 * cannot answer quickly, the coded default is already the right answer. (Same reasoning, and the
 * same number, as content-service's `DEDUP_SETTINGS_TIMEOUT_MS`.)
 */
const TRACKING_SETTINGS_TIMEOUT_MS = 800;

/**
 * `GET /api/tracking-config` is **public** — the website renders the consent banner from it
 * before any visitor could be authenticated, and a pixel id is public by construction (it
 * ships in the page). Nothing secret resolves here: the assembler projects only the `tracking`
 * group, and only destinations an operator both enabled and configured.
 */
@Controller('tracking-config')
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(@Inject(SETTINGS_CLIENT) private readonly client: ClientProxy) {}

  @Get()
  async get(@RequestLocale() locale: Locale): Promise<PublicTrackingConfig> {
    try {
      const resolved = await sendRequest<ResolvedGroup>(
        this.client,
        SETTINGS_RESOLVE_GROUP,
        { group: TRACKING_GROUP },
        {
          headers: forwardHeaders(null, locale),
          timeoutMs: TRACKING_SETTINGS_TIMEOUT_MS,
        },
      );
      return toPublicTrackingConfig(resolved);
    } catch (error) {
      // This endpoint sits on the render path of every public page. Failing it would take the
      // whole site down for the sake of a pixel, so an unreachable settings-service collapses
      // to the same safe answer as "nothing configured": ask for consent, load no tag.
      this.logger.warn(
        `tracking config unavailable, serving coded defaults: ${String(error)}`,
      );
      return DEFAULT_TRACKING_CONFIG;
    }
  }
}
