import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom doesn't implement matchMedia; default to "no reduce-motion, fine pointer" so the motion
// components render their animated branch. A spec can override `window.matchMedia` to simulate
// `prefers-reduced-motion` (MotionProvider/InkCursor gating).
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Framer Motion's `whileInView`/`useInView` use IntersectionObserver, which jsdom lacks. A
// deterministic shim that reports the element as intersecting on observe → reveals fire in tests.
if (typeof window.IntersectionObserver !== 'function') {
  class TestIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(target: Element): void {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this,
      );
    }
    unobserve(): void {
      /* no-op */
    }
    disconnect(): void {
      /* no-op */
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  window.IntersectionObserver =
    TestIntersectionObserver as unknown as typeof IntersectionObserver;
}
