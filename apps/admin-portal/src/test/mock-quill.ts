/**
 * A deterministic stand-in for the `quill` module so the rich-text editor's wiring can be
 * unit-tested without a real Quill instance (which needs DOM range/selection APIs jsdom only
 * partially provides — like the IntersectionObserver/ResizeObserver shims in `test-setup`).
 * A spec does `vi.mock('quill', () => ({ default: MockQuill }))`, then drives the editor via
 * `getLastQuill()?.emitTextChange(html)`. Mirrors the slice of Quill `useRichText` touches:
 * `new Quill(container, options)`, `.root` (an element), and `.on('text-change', cb)`.
 */
export interface MockQuillHandle {
  root: HTMLDivElement;
  options: unknown;
  /** Simulate a user edit: set the HTML, then fire the registered `text-change` listeners. */
  emitTextChange(html: string): void;
}

const instances: MockQuillHandle[] = [];

/** The most recently constructed mock editor (the one the component just mounted). */
export function getLastQuill(): MockQuillHandle | undefined {
  return instances[instances.length - 1];
}

/** Clear the registry between tests (call from `afterEach`). */
export function resetQuillInstances(): void {
  instances.length = 0;
}

export class MockQuill {
  root: HTMLDivElement;
  options: unknown;
  private handlers: Array<() => void> = [];

  constructor(container: HTMLElement, options: unknown) {
    this.options = options;
    this.root = document.createElement('div');
    this.root.className = 'ql-editor';
    container.appendChild(this.root);
    instances.push({
      root: this.root,
      options,
      emitTextChange: (html: string) => {
        this.root.innerHTML = html;
        for (const handler of this.handlers) {
          handler();
        }
      },
    });
  }

  on(_event: string, handler: () => void): void {
    this.handlers.push(handler);
  }
}
