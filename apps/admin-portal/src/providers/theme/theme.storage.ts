/** Portal theme (dual dark + light; the website is single-theme — WEB7). */
export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'sanad.admin.theme';

/** Synchronously read the persisted theme (F12); null when unset/invalid. */
export function readThemeFromStorage(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

/** Persist the chosen theme (app setting beats device, F11). */
export function writeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage failures (private mode) — falls back to the default theme
  }
}
