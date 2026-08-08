import type { Role } from '@sanad/contracts';
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import {
  makeAsset,
  renderWithProviders,
  stubMediaExplorerFetch,
} from '../../../test';
import { MediaPage } from '../index';

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * The page itself is now only a title over the shared `MediaExplorer` (F9) — every state, filter
 * and permission rule is covered where it lives, in `media-explorer.spec`. What is worth pinning
 * HERE is that the page really does mount the explorer, and keeps its own heading.
 */
describe('MediaPage', () => {
  it('renders its heading above the explorer', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    renderWithProviders(<MediaPage />, { store: storeWith(['manage']) });

    expect(
      screen.getByRole('heading', { name: 'Media library' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('a1.png')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Folders' }),
    ).toBeInTheDocument();
  });

  it('gives a read-only user the library without the write actions', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    renderWithProviders(<MediaPage />, {
      store: storeWith(['media.read'], ['developer']),
    });

    expect(await screen.findByText('a1.png')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upload files' }),
    ).not.toBeInTheDocument();
  });
});
