import { afterEach, describe, expect, it } from 'vitest';
import { AUTH_STORAGE_KEY } from './auth.constants';
import {
  clearAuthStorage,
  readAuthFromStorage,
  writeAuthToStorage,
} from './auth.storage';

afterEach(() => {
  localStorage.clear();
});

describe('auth.storage', () => {
  it('reads an empty state when nothing is stored', () => {
    expect(readAuthFromStorage()).toEqual({
      access: null,
      refresh: null,
      identity: null,
    });
  });

  it('round-trips a written state', () => {
    writeAuthToStorage({
      access: 'a',
      refresh: 'r',
      identity: { userId: 'u1', roles: ['admin'], permissions: ['manage'] },
    });
    const read = readAuthFromStorage();
    expect(read.access).toBe('a');
    expect(read.refresh).toBe('r');
    expect(read.identity?.userId).toBe('u1');
  });

  it('fails closed on corrupt JSON', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, '{not json');
    expect(readAuthFromStorage().access).toBeNull();
  });

  it('fails closed when a token is missing', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ access: 'a' }));
    expect(readAuthFromStorage().access).toBeNull();
  });

  it('clears storage when writing a logged-out state', () => {
    writeAuthToStorage({ access: 'a', refresh: 'r', identity: null });
    writeAuthToStorage({ access: null, refresh: null, identity: null });
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('clearAuthStorage removes the key', () => {
    writeAuthToStorage({ access: 'a', refresh: 'r', identity: null });
    clearAuthStorage();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
