/**
 * The minimal time seam the interceptor/filter stamp responses with. The app passes
 * its shared `DateTimeService` (which has `nowIso`) — so these adapters never call
 * `new Date()` (N3) and stay decoupled from `@sanad/database`.
 */
export interface TimestampSource {
  nowIso(): string;
}
