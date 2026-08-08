import type { Role } from '@sanad/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../data/store/register-apis';
import { identityLoaded } from '../../data/auth/auth.slice';
import { createAppStore } from '../../data/store/store';
import { i18n } from '../../i18n';
import {
  makeAsset,
  renderWithProviders,
  stubMediaExplorerFetch,
} from '../../test';
import { MediaLibraryModal } from './media-library-modal';

const asset = makeAsset();

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
  stubMediaExplorerFetch({ assets: [asset] });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MediaLibraryModal', () => {
  it('opens the FULL explorer and picks the asset through its full-screen preview', async () => {
    const onPick = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <MediaLibraryModal open onOpenChange={onOpenChange} onPick={onPick} />,
      { store: storeWith(['manage']) },
    );

    // the picker is the same explorer as the page — folders and all
    expect(screen.getByText('Media library')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Folders' }),
    ).toBeInTheDocument();

    // A plain click VIEWS the image full-screen (owner, 2026-07-25); "Use this image" picks it.
    await user.click(await screen.findByRole('button', { name: 'a1.png' }));
    await user.click(
      await screen.findByRole('button', { name: 'Use this image' }),
    );
    expect(onPick).toHaveBeenCalledWith(asset);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('picks a file straight away on a double-click', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <MediaLibraryModal open onOpenChange={vi.fn()} onPick={onPick} />,
      { store: storeWith(['manage']) },
    );

    await user.dblClick(await screen.findByRole('button', { name: 'a1.png' }));
    expect(onPick).toHaveBeenCalledWith(asset);
  });

  /**
   * The owner's report: a picker that opened over a form modal at the SAME width read as a
   * replacement for that form. It is now near-full-screen — a workspace, visibly a layer above.
   */
  it('opens near-full-screen, not at the parent form’s width', () => {
    renderWithProviders(
      <MediaLibraryModal open onOpenChange={vi.fn()} onPick={vi.fn()} />,
      { store: storeWith(['manage']) },
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('90rem');
  });

  it('hides the write actions for a user without media.manage', async () => {
    renderWithProviders(
      <MediaLibraryModal open onOpenChange={vi.fn()} onPick={vi.fn()} />,
      { store: storeWith(['media.read'], ['developer']) },
    );
    expect(await screen.findByText('a1.png')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New folder' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upload files' }),
    ).not.toBeInTheDocument();
  });

  it('renders in Arabic (RTL parity smoke)', async () => {
    await i18n.changeLanguage('ar');
    renderWithProviders(
      <MediaLibraryModal open onOpenChange={vi.fn()} onPick={vi.fn()} />,
      { store: storeWith(['manage']) },
    );
    await waitFor(() =>
      expect(screen.getByText('مكتبة الوسائط')).toBeInTheDocument(),
    );
    // the library root, in the tree AND in the breadcrumb
    expect(screen.getAllByText('كل الملفّات').length).toBeGreaterThan(1);
  });
});
