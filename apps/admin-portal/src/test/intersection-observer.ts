/**
 * A deterministic `IntersectionObserver` shim for jsdom (which has none). The kit's
 * ServerSelect attaches an observer to an infinite-scroll sentinel; this records every
 * live observer + its observed elements so a test can fire an intersection SYNCHRONOUSLY
 * via `triggerIntersection()` — never relying on real scroll/layout (absent in jsdom).
 */
interface ObserverEntry {
  observer: MockIntersectionObserver;
  callback: IntersectionObserverCallback;
  elements: Set<Element>;
}

const registry: ObserverEntry[] = [];

function makeEntry(
  target: Element,
  isIntersecting: boolean,
): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect();
  return {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: null,
    time: 0,
  };
}

export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Document | Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  private readonly entry: ObserverEntry;

  constructor(callback: IntersectionObserverCallback) {
    this.entry = { observer: this, callback, elements: new Set<Element>() };
    registry.push(this.entry);
  }

  observe(target: Element): void {
    this.entry.elements.add(target);
  }

  unobserve(target: Element): void {
    this.entry.elements.delete(target);
  }

  disconnect(): void {
    this.entry.elements.clear();
    const index = registry.indexOf(this.entry);
    if (index >= 0) {
      registry.splice(index, 1);
    }
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/** Fire an intersection for every observed element on every live observer (test helper). */
export function triggerIntersection(isIntersecting = true): void {
  for (const entry of [...registry]) {
    const records = [...entry.elements].map((target) =>
      makeEntry(target, isIntersecting),
    );
    if (records.length > 0) {
      entry.callback(records, entry.observer);
    }
  }
}

/** Drop all recorded observers (call between tests to avoid cross-test leakage). */
export function resetIntersectionObservers(): void {
  registry.length = 0;
}
