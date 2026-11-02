import { afterEach, describe, expect, it, vi } from 'vitest';
import { createScrollLock, SCROLL_LOCK_CLASS, scrollLock } from './scroll-lock';

afterEach(() => {
  document.documentElement.className = '';
});

describe('createScrollLock', () => {
  it('starts unlocked and marks the document only while held', () => {
    const lock = createScrollLock();
    expect(lock.isLocked()).toBe(false);
    expect(document.documentElement).not.toHaveClass(SCROLL_LOCK_CLASS);

    const release = lock.acquire();
    expect(lock.isLocked()).toBe(true);
    expect(document.documentElement).toHaveClass(SCROLL_LOCK_CLASS);

    release();
    expect(lock.isLocked()).toBe(false);
    expect(document.documentElement).not.toHaveClass(SCROLL_LOCK_CLASS);
  });

  it('is reentrant — the page stays locked until every holder releases', () => {
    const lock = createScrollLock();
    const first = lock.acquire();
    const second = lock.acquire();

    first();
    expect(lock.isLocked()).toBe(true);
    expect(document.documentElement).toHaveClass(SCROLL_LOCK_CLASS);

    second();
    expect(lock.isLocked()).toBe(false);
  });

  // A React effect cleanup can fire twice (StrictMode double-invoke, an unmount race). A release
  // that decremented twice would unlock the page while another overlay is still open.
  it('ignores a release called more than once', () => {
    const lock = createScrollLock();
    const outer = lock.acquire();
    const inner = lock.acquire();

    inner();
    inner();
    inner();

    expect(lock.isLocked()).toBe(true);
    outer();
    expect(lock.isLocked()).toBe(false);
  });

  it('notifies subscribers on each transition, never on the reentrant middle', () => {
    const lock = createScrollLock();
    const seen = vi.fn();
    const unsubscribe = lock.subscribe(seen);

    const first = lock.acquire();
    expect(seen).toHaveBeenCalledTimes(1);

    const second = lock.acquire();
    expect(seen).toHaveBeenCalledTimes(1);

    first();
    expect(seen).toHaveBeenCalledTimes(1);

    second();
    expect(seen).toHaveBeenCalledTimes(2);

    unsubscribe();
    lock.acquire()();
    expect(seen).toHaveBeenCalledTimes(2);
  });
});

describe('scrollLock', () => {
  it('is the shared singleton the motion provider reads', () => {
    expect(scrollLock.isLocked()).toBe(false);
    const release = scrollLock.acquire();
    expect(scrollLock.isLocked()).toBe(true);
    release();
    expect(scrollLock.isLocked()).toBe(false);
  });
});
