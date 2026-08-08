import { buildAccentCss } from '../math';

/**
 * Server-renders the per-route accent rules once at the shell (P8.D — see `buildAccentCss`).
 * `dangerouslySetInnerHTML` is required: React text-escapes quotes in `<style>` children,
 * which would corrupt the `[data-system='x']` attribute selectors. The CSS is generated
 * entirely from `@sanad/config` tokens — no user input reaches it.
 */
export function AccentStyle() {
  return <style dangerouslySetInnerHTML={{ __html: buildAccentCss() }} />;
}
