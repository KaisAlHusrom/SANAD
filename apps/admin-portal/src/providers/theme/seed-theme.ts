import { readThemeFromStorage, type Theme } from './theme.storage';

/** Apply the theme to the document root (`[data-app][data-theme="…"]`). */
export function applyThemeToDocument(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/**
 * Seed `data-theme` on the first frame, before React mounts (F12). Defaults to dark
 * (the portal's signature default; the app setting beats the device, F11).
 */
export function seedTheme(): Theme {
  const theme = readThemeFromStorage() ?? 'dark';
  applyThemeToDocument(theme);
  return theme;
}
