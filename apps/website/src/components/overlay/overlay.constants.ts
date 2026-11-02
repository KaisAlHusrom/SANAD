/**
 * The token scope. The portal MUST land inside this element, never on `document.body`: every
 * `--web-*` token is declared on `.sanad-web`, and the layout inlines the runtime branding vars
 * and font families on that same node — a body-level portal would render the dialog token-less.
 */
export const OVERLAY_HOST_SELECTOR = '.sanad-web';

/**
 * Deliberately does NOT filter on `offsetParent`: jsdom has no layout, so that check would empty
 * the list in every test while passing in the browser. A dialog's own contents are visible by
 * construction, so `disabled`/`hidden`/`aria-hidden` is the honest filter.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
]
  .map((selector) => `${selector}:not([hidden]):not([aria-hidden="true"])`)
  .join(', ');
