import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import {
  MockIntersectionObserver,
  resetIntersectionObservers,
} from './test/intersection-observer';

afterEach(() => {
  cleanup();
  resetIntersectionObservers();
});

// jsdom lacks the Pointer Capture API + scrollIntoView that Radix interaction primitives
// (Toast swipe, Dialog/Select) probe on pointer events; benign no-op stubs keep them from
// throwing during tests without changing behaviour.
if (typeof Element.prototype.hasPointerCapture !== 'function') {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
}
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => undefined;
}

// jsdom doesn't implement IntersectionObserver; the kit's ServerSelect uses it for the
// infinite-scroll sentinel. Install the deterministic shim so tests fire intersections
// synchronously via `triggerIntersection()`.
if (typeof globalThis.IntersectionObserver !== 'function') {
  globalThis.IntersectionObserver = MockIntersectionObserver;
}

// jsdom doesn't implement ResizeObserver; cmdk (the ServerSelect command list) probes it.
// A benign no-op stub is enough — tests don't assert on resize behaviour.
if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe(): void {
      return undefined;
    }
    unobserve(): void {
      return undefined;
    }
    disconnect(): void {
      return undefined;
    }
  };
}

// jsdom doesn't implement matchMedia; the theme provider reads it only as a
// first-launch fallback, so a benign stub is enough for tests.
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
