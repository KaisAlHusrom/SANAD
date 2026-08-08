import type { Theme } from '../../providers/theme';

/**
 * The bundled portal logo, used ONLY as the F7 fallback when the owner hasn't uploaded a
 * `branding.logoUrl` in the Visual Identity settings. One source so the sidebar and the login
 * screen can never drift apart.
 */
export function bundledLogoSrc(theme: Theme): string {
  return `/admin/brand/logo-${theme}.png`;
}
