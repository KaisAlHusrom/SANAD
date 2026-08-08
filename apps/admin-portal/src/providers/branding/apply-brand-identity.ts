/**
 * DOM side-effects that apply the visual-identity record to the live document: the runtime
 * brand-accent `<style>`, the favicon link, and the tab title. Kept out of React so they're
 * pure + unit-testable; the `use-branding-theme` hook orchestrates when to call them.
 */

/** Create/update the `<style id>` with `css`; empty `css` removes it (base tokens then stand). */
export function upsertStyleElement(id: string, css: string): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(id) as HTMLStyleElement | null;
  if (!css) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.textContent = css;
    return;
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

/** Point the favicon `<link rel="icon">` at `href` (creating the link if the page lacks one). */
export function applyFavicon(href: string): void {
  if (typeof document === 'undefined' || !href) return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

/** Set the document (tab) title to the brand name. */
export function applyDocumentTitle(title: string): void {
  if (typeof document === 'undefined' || !title) return;
  document.title = title;
}
