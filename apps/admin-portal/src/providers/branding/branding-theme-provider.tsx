import type { ReactNode } from 'react';
import { useBrandingTheme } from './use-branding-theme';

/**
 * Mounts the visual-identity → portal theming (accent, favicon, title) once for the whole app.
 * Sits inside the Redux + direction providers (it reads the branding query + the active locale)
 * and passes children through untouched.
 */
export function BrandingThemeProvider({ children }: { children: ReactNode }) {
  useBrandingTheme();
  return <>{children}</>;
}
