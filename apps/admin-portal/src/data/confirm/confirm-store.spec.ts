import { describe, expect, it, vi } from 'vitest';
import { ConfirmStore } from './confirm-store';

describe('ConfirmStore', () => {
  it('exposes the active confirmation while a request is open', () => {
    const store = new ConfirmStore();
    void store.request({ title: 'Delete', message: 'Sure?' });

    expect(store.getSnapshot()).toMatchObject({
      options: { title: 'Delete', message: 'Sure?' },
      pending: false,
    });
  });

  it('confirm() resolves true and clears (no onConfirm)', async () => {
    const store = new ConfirmStore();
    const result = store.request({ title: 'Delete', message: 'Sure?' });

    await store.confirm();

    expect(await result).toBe(true);
    expect(store.getSnapshot()).toBeNull();
  });

  it('cancel() resolves false and clears', async () => {
    const store = new ConfirmStore();
    const result = store.request({ title: 'Delete', message: 'Sure?' });

    store.cancel();

    expect(await result).toBe(false);
    expect(store.getSnapshot()).toBeNull();
  });

  it('mutation-aware confirm runs onConfirm, then resolves true', async () => {
    const store = new ConfirmStore();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const result = store.request({
      title: 'Delete',
      message: 'Sure?',
      onConfirm,
    });

    await store.confirm();

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(await result).toBe(true);
    expect(store.getSnapshot()).toBeNull();
  });

  it('keeps the dialog open with an error when onConfirm rejects', async () => {
    const store = new ConfirmStore();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Network down'));
    const result = store.request({
      title: 'Delete',
      message: 'Sure?',
      onConfirm,
    });

    await store.confirm();

    expect(store.getSnapshot()).toMatchObject({
      pending: false,
      error: 'Network down',
    });

    // The promise is still pending until the user acts; cancelling resolves it false.
    store.cancel();
    expect(await result).toBe(false);
  });

  it('reset() resolves a pending confirmation to false (no deadlock)', async () => {
    const store = new ConfirmStore();
    const result = store.request({ title: 'Delete', message: 'Sure?' });

    store.reset();

    expect(await result).toBe(false);
    expect(store.getSnapshot()).toBeNull();
  });
});
