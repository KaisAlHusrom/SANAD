import type { EventActor } from './event-actor.js';

/**
 * One declared reaction to an event (U27a/b). `at` is the repo-relative path of the
 * subscription, so the claim is checkable rather than aspirational — the catalog's own spec
 * asserts every path exists. A consumer list nobody can locate is not a consumer list.
 */
export interface EventConsumer {
  readonly actor: EventActor;
  readonly at: string;
  /** What it does when the event lands, in one line. */
  readonly reacts: string;
}
