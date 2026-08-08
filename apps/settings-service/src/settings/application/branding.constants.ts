/** Redis version key for a settings group's cache — `incr`-ed on every write to it. */
export function settingsVersionKey(group: string): string {
  return `settings:${group}:version`;
}

/** Redis version key for the branding cache — `incr`-ed on every branding write. */
export const BRANDING_VERSION_KEY = settingsVersionKey('branding');

/** TTL (seconds) for a cached branding record — long; the version key prevents stale. */
export const BRANDING_CACHE_TTL_SECONDS = 3600;

/** The versioned cache key for the resolved global branding record. */
export function brandingCacheKey(version: number): string {
  return `settings:branding:v${version}:global`;
}
