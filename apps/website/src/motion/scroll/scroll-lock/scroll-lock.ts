/** Set on `<html>` while any overlay holds the lock; `overlay.css` turns it into `overflow: hidden`. */
export const SCROLL_LOCK_CLASS = 'is-scroll-locked';

export interface ScrollLock {
  /** Take the lock. Returns this holder's own release, which is safe to call more than once. */
  acquire: () => () => void;
  isLocked: () => boolean;
  subscribe: (listener: () => void) => () => void;
}

/**
 * The page-scroll lock an overlay holds while it is open.
 *
 * Two things read it, and it exists because neither can work alone. `overflow: hidden` on `<html>`
 * stops the browser, but on desktop the browser is **not** what scrolls this site — `MotionProvider`
 * runs a speed-capped scroller that `preventDefault()`s wheel and key events and writes `scrollTo`
 * every frame. So the provider consults `isLocked()` and bails *before* its `preventDefault()`,
 * which hands the wheel back to the browser and lets the overlay's own body scroll natively.
 *
 * Reentrant: two overlays may legitimately stack, and the page must stay locked until the last one
 * closes. A factory plus a singleton, mirroring `createCosmosScrollStore`.
 */
export function createScrollLock(): ScrollLock {
  let holders = 0;
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  const applyToDocument = (): void => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle(SCROLL_LOCK_CLASS, holders > 0);
  };

  return {
    acquire: () => {
      holders += 1;
      if (holders === 1) {
        applyToDocument();
        notify();
      }
      // Captured per holder so a double-invoked effect cleanup cannot release someone else's lock.
      let released = false;
      return () => {
        if (released) return;
        released = true;
        holders -= 1;
        if (holders === 0) {
          applyToDocument();
          notify();
        }
      };
    },
    isLocked: () => holders > 0,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const scrollLock = createScrollLock();
