import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastStore } from './toast-store';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastStore', () => {
  it('adds a toast and exposes it via the snapshot with defaults applied', () => {
    const store = new ToastStore();
    const id = store.add({ title: 'Saved' });

    const [record] = store.getSnapshot();
    expect(record).toMatchObject({
      id,
      title: 'Saved',
      variant: 'info',
      duration: 4000,
    });
  });

  it('collapses a repeated dedupeKey into the existing toast (no duplicate)', () => {
    const store = new ToastStore();
    const first = store.add({
      title: 'Uploading',
      dedupeKey: 'upload',
      duration: 0,
    });
    const second = store.add({
      title: 'Uploading again',
      dedupeKey: 'upload',
      duration: 0,
    });

    expect(second).toBe(first);
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0]?.title).toBe('Uploading again');
  });

  it('updates a toast in place, keeping fields not in the patch', () => {
    const store = new ToastStore();
    const id = store.add({ title: 'Loading', variant: 'loading', duration: 0 });
    store.update(id, { variant: 'success', title: 'Done' });

    const [record] = store.getSnapshot();
    expect(record).toMatchObject({ id, title: 'Done', variant: 'success' });
  });

  it('caps the visible window and promotes a queued toast when a visible one clears', () => {
    const store = new ToastStore();
    const ids = ['a', 'b', 'c', 'd'].map((title) =>
      store.add({ title, duration: 0 }),
    );
    expect(store.getSnapshot()).toHaveLength(3);
    expect(store.getSnapshot().map((r) => r.title)).toEqual(['a', 'b', 'c']);

    store.dismiss(ids[0] as string);
    expect(store.getSnapshot().map((r) => r.title)).toEqual(['b', 'c', 'd']);
  });

  it('auto-dismisses after the duration; a 0-duration toast persists', () => {
    const store = new ToastStore();
    store.add({ title: 'Transient', duration: 4000 });
    store.add({ title: 'Sticky', duration: 0 });

    vi.advanceTimersByTime(4000);

    const titles = store.getSnapshot().map((r) => r.title);
    expect(titles).toEqual(['Sticky']);
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const store = new ToastStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.add({ title: 'A', duration: 0 });
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    store.add({ title: 'B', duration: 0 });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('reset clears every toast and its timers', () => {
    const store = new ToastStore();
    store.add({ title: 'A', duration: 4000 });
    store.reset();

    expect(store.getSnapshot()).toEqual([]);
    // No lingering timer fires onto the cleared store.
    expect(() => vi.advanceTimersByTime(4000)).not.toThrow();
    expect(store.getSnapshot()).toEqual([]);
  });
});
