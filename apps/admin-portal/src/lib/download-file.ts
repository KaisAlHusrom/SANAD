/**
 * Trigger a browser download of a URL. The `download` attribute renames the file where the
 * browser honours it (same-origin, or a cross-origin server that doesn't forbid it); when it
 * can't — a public R2 object on another origin — the browser falls back to opening the file in a
 * new tab, which still lets the user save it. Either way the click never navigates the app away.
 */
export function downloadFile(url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.target = '_blank';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
