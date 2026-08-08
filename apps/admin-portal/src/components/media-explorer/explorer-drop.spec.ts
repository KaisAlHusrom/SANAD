import type { MediaFolderNode } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { evaluateDrop } from './explorer-drop';

function node(
  id: string,
  children: MediaFolderNode[] = [],
  parentId: string | null = null,
): MediaFolderNode {
  return {
    id,
    name: id,
    parentId,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    assetCount: 0,
    children,
  };
}

const dark = node('dark', [], 'colors');
const colors = node('colors', [dark], 'brand');
const brand = node('brand', [colors]);
const clients = node('clients');
const roots = [brand, clients];

describe('evaluateDrop — assets', () => {
  it('allows dropping files into another folder', () => {
    expect(
      evaluateDrop(
        { kind: 'assets', ids: ['a'], sourceFolderId: null },
        'brand',
        roots,
      ),
    ).toEqual({ ok: true });
  });

  it('allows dropping files back onto the root', () => {
    expect(
      evaluateDrop(
        { kind: 'assets', ids: ['a'], sourceFolderId: 'brand' },
        null,
        roots,
      ),
    ).toEqual({ ok: true });
  });

  it('REFUSES a drop onto the folder the files already live in — a no-op request', () => {
    expect(
      evaluateDrop(
        { kind: 'assets', ids: ['a'], sourceFolderId: 'brand' },
        'brand',
        roots,
      ),
    ).toEqual({ ok: false, reason: 'sameFolder' });
  });

  it('REFUSES a drop of a mixed selection only when EVERY file is already there', () => {
    // A selection gathered by search can span folders; moving it together is meaningful.
    expect(
      evaluateDrop(
        { kind: 'assets', ids: ['a', 'b'], sourceFolderId: undefined },
        'brand',
        roots,
      ),
    ).toEqual({ ok: true });
  });
});

describe('evaluateDrop — folders', () => {
  it('allows moving a folder under an unrelated folder', () => {
    expect(
      evaluateDrop(
        { kind: 'folder', id: 'clients', parentId: null },
        'brand',
        roots,
      ),
    ).toEqual({ ok: true });
  });

  it('allows moving a nested folder back out to the root', () => {
    expect(
      evaluateDrop(
        { kind: 'folder', id: 'colors', parentId: 'brand' },
        null,
        roots,
      ),
    ).toEqual({ ok: true });
  });

  it('REFUSES dropping a folder onto itself', () => {
    expect(
      evaluateDrop(
        { kind: 'folder', id: 'brand', parentId: null },
        'brand',
        roots,
      ),
    ).toEqual({ ok: false, reason: 'self' });
  });

  it('REFUSES dropping a folder into its OWN descendant — the tree would detach', () => {
    // Mirrors the service's 400 cycle guard, so the user sets a "can't drop here" cursor
    // instead of discovering it from a failed round-trip.
    expect(
      evaluateDrop(
        { kind: 'folder', id: 'brand', parentId: null },
        'dark',
        roots,
      ),
    ).toEqual({ ok: false, reason: 'descendant' });
  });

  it('REFUSES dropping a folder onto the parent it already has', () => {
    expect(
      evaluateDrop(
        { kind: 'folder', id: 'colors', parentId: 'brand' },
        'brand',
        roots,
      ),
    ).toEqual({ ok: false, reason: 'sameFolder' });
    expect(
      evaluateDrop(
        { kind: 'folder', id: 'clients', parentId: null },
        null,
        roots,
      ),
    ).toEqual({ ok: false, reason: 'sameFolder' });
  });
});
