/**
 * ISO date → the mono log stamp (YYYY.MM.DD) — a pure string slice, never `new Date()` (N3).
 * Shared by the blog index cards and the article meta strip (U3). Empty string when unpublished.
 */
export function logStamp(iso: string | null): string {
  return iso ? iso.slice(0, 10).replaceAll('-', '.') : '';
}
