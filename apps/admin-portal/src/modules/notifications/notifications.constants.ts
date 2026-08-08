/** How many recent notices the bell dropdown shows (newest-first; the backend caps at this). */
export const BELL_PAGE_SIZE = 10;

/** Page size for the unread-count probe — we only read `meta.total`, so one row is enough. */
export const UNREAD_PROBE_PAGE_SIZE = 1;

/** Cap shown in the unread badge before it renders as `N+`. */
export const UNREAD_BADGE_MAX = 9;
