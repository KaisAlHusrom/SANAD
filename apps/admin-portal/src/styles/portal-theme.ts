import { renderPortalThemeCss } from '@sanad/config';

const STYLE_ELEMENT_ID = 'sanad-portal-theme';

/**
 * Inject the portal theme CSS variables once (dark default + light override on
 * `[data-app][data-theme]`). Values are single-sourced in `@sanad/config`; the
 * tailwind utilities map to these `var(--*)` custom properties (U6).
 */
export function injectPortalTheme(): void {
  if (
    typeof document === 'undefined' ||
    document.getElementById(STYLE_ELEMENT_ID)
  ) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = renderPortalThemeCss();
  document.head.appendChild(style);
}
