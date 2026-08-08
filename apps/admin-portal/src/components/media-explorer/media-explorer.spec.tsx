import type { Role } from '@sanad/contracts';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../data/store/register-apis';
import { identityLoaded } from '../../data/auth/auth.slice';
import { confirmStore } from '../../data/confirm';
import { createAppStore } from '../../data/store/store';
import { i18n } from '../../i18n';
import {
  makeAsset,
  makeFolderNode,
  renderWithProviders,
  stubMediaExplorerFetch,
  stubR2Upload,
} from '../../test';
import { ConfirmationRoot } from '../feedback';
import { MediaExplorer } from './media-explorer';

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
  confirmStore.reset();
  vi.unstubAllGlobals();
});

/**
 * The explorer's STATES, one test each (U23). The owner's rule is that nothing ships with only
 * its happy path built, and "empty" is not one state here but three — each with its own sentence
 * and its own next action.
 */
describe('MediaExplorer — every state is rendered', () => {
  it('first use: an empty library asks for the first upload, not "this folder is empty"', async () => {
    stubMediaExplorerFetch();
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    expect(await screen.findByText('The library is empty')).toBeInTheDocument();
    expect(screen.getByText('No folders yet.')).toBeInTheDocument();
  });

  it('an empty FOLDER says so, and invites a drag — a different situation, a different sentence', async () => {
    stubMediaExplorerFetch({
      tree: {
        roots: [makeFolderNode({ id: 'f1', name: 'Brand' })],
        rootAssetCount: 0,
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    // the tree row and the folder tile in the grid both open it — take the tree's
    const [treeRow] = await screen.findAllByRole('button', { name: /Brand/ });
    await user.click(treeRow as HTMLElement);

    expect(await screen.findByText('This folder is empty')).toBeInTheDocument();
  });

  it('a search that matches nothing names the term and offers a way back', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    const user = userEvent.setup();
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    await screen.findByText('a1.png');
    stubMediaExplorerFetch({ assets: [] });
    await user.type(screen.getByLabelText('Search files…'), 'nope');

    expect(
      await screen.findByText('Nothing matches “nope”'),
    ).toBeInTheDocument();
    // …and the scope change is stated, because a search leaves the current folder behind
    expect(screen.getByText('Searching the whole library')).toBeInTheDocument();
  });

  it('a failed list names the failure and offers a retry', async () => {
    stubMediaExplorerFetch({ listStatus: 500 });
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    expect(
      await screen.findByText("Couldn't load the files."),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('a 503 says storage was never configured — a different problem with a different fix', async () => {
    stubMediaExplorerFetch({ listStatus: 503 });
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    expect(
      await screen.findByText(
        "Storage isn't configured yet — set it up in Integrations.",
      ),
    ).toBeInTheDocument();
  });

  it('a broken folder tree fails on its OWN, without blanking the files beside it', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()], treeStatus: 500 });
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    expect(
      await screen.findByText("Couldn't load the folders."),
    ).toBeInTheDocument();
    expect(screen.getByText('a1.png')).toBeInTheDocument();
  });

  it('renders the files, the folders, and the write actions for a manager', async () => {
    stubMediaExplorerFetch({
      assets: [makeAsset()],
      tree: {
        roots: [makeFolderNode({ id: 'f1', name: 'Brand', assetCount: 2 })],
        rootAssetCount: 1,
      },
    });
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    expect(await screen.findByText('a1.png')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upload files' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New folder' }),
    ).toBeInTheDocument();
  });

  /** U23c: a missing permission is EXPLAINED, never expressed as a silently absent button. */
  it('read-only: no write actions, and the reason is on screen', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['media.read'], ['developer']),
    });

    expect(await screen.findByText('a1.png')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upload files' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'You have view-only access — ask an administrator to upload or organize.',
      ),
    ).toBeInTheDocument();
  });

  it('an upload still in flight is labelled, not shown as a broken image', async () => {
    stubMediaExplorerFetch({
      assets: [makeAsset({ status: 'pending', filename: 'half.png' })],
    });
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    expect(await screen.findByText('half.png')).toBeInTheDocument();
    expect(screen.getByText('Uploading')).toBeInTheDocument();
  });

  it('a plain click opens the file full-screen (a preview), not a selection', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    const user = userEvent.setup();
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    // Owner, 2026-07-25: clicking an image must VIEW it, not select it.
    await user.click(await screen.findByRole('button', { name: 'a1.png' }));

    // The lightbox is open (its Download action is on screen) and nothing was selected.
    expect(
      await screen.findByRole('button', { name: 'Download' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
  });

  it('⌘/Ctrl-clicking a file selects it, and clearing puts it away', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    const user = userEvent.setup();
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    const tile = await screen.findByRole('button', { name: 'a1.png' });
    fireEvent.click(tile, { ctrlKey: true });
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
  });

  it('deleting the selection asks first, naming what it is about to do', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <MediaExplorer mode="page" />
        <ConfirmationRoot />
      </>,
      { store: storeWith(['manage']) },
    );

    const tile = await screen.findByRole('button', { name: 'a1.png' });
    fireEvent.click(tile, { ctrlKey: true });
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Delete file')).toBeInTheDocument();
  });

  it("right-clicking a file offers Delete, which asks to confirm (the owner's menu)", async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <MediaExplorer mode="page" />
        <ConfirmationRoot />
      </>,
      { store: storeWith(['manage']) },
    );

    const tile = await screen.findByRole('button', { name: 'a1.png' });
    fireEvent.contextMenu(tile);

    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(await screen.findByText('Delete file')).toBeInTheDocument();
  });

  it('no "Upload media" tile clutters the grid — upload lives in the toolbar', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    await screen.findByText('a1.png');
    expect(screen.queryByText('Upload media')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upload files' }),
    ).toBeInTheDocument();
  });

  it('switches to the list view and keeps showing the same file', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    const user = userEvent.setup();
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    await screen.findByText('a1.png');
    await user.click(screen.getByRole('button', { name: 'List view' }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByText('a1.png')).toBeInTheDocument();
  });

  it('walks into a folder and back out through the breadcrumb', async () => {
    stubMediaExplorerFetch({
      tree: {
        roots: [makeFolderNode({ id: 'f1', name: 'Brand' })],
        rootAssetCount: 0,
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });

    const [treeRow] = await screen.findAllByRole('button', { name: /Brand/ });
    await user.click(treeRow as HTMLElement);
    // the crumb bar now reads "All files ▸ Brand"
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: 'Brand' }).length,
      ).toBeGreaterThan(0),
    );

    await user.click(
      screen.getAllByRole('button', { name: 'All files' })[0] as HTMLElement,
    );
    // back at the top: the root crumb is the current page, and Brand is a tile again
    await waitFor(() =>
      expect(
        screen
          .getAllByRole('button', { name: 'All files' })
          .some((crumb) => crumb.getAttribute('aria-current') === 'page'),
      ).toBe(true),
    );
  });

  /**
   * The picker opens from the GLOBAL modal manager, which is mounted OUTSIDE `RouterProvider`.
   * An earlier version read the URL via react-router's `useSearchParams`, which threw
   * "useLocation() may be used only in the context of a <Router>" there and blanked the whole app
   * (found by driving the picker live, 2026-07-20). This renders `mode="picker"` with NO router in
   * the tree at all and asserts it just works.
   */
  it('renders in picker mode with NO Router in the tree (the global-modal case)', async () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    const store = createAppStore();
    store.dispatch(
      identityLoaded({
        userId: 'u',
        roles: ['admin'],
        permissions: ['manage'],
      }),
    );
    await i18n.changeLanguage('en');

    function NoRouter({ children }: { children: ReactNode }) {
      return (
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </Provider>
      );
    }

    expect(() =>
      render(<MediaExplorer mode="picker" selectionMode="single" />, {
        wrapper: NoRouter,
      }),
    ).not.toThrow();
    expect(await screen.findByText('a1.png')).toBeInTheDocument();
  });

  /**
   * The owner's report (2026-07-25): clicking Upload, picking a file → NOTHING, not even a network
   * request. Cause: `event.target.files` is a LIVE FileList; clearing `input.value` (to allow
   * re-picking the same file) emptied it before the length check, so the upload never started.
   *
   * NOTE this test guards the WIRED happy path (input → queue → sign), not the live-FileList
   * timing itself — jsdom does NOT empty `input.files` on `value=''`, so the buggy version passed
   * here too. Like the router-context crash, the real defect only reproduced in a browser (U21e);
   * the fix (snapshot with `Array.from` before clearing) is verified live.
   */
  it('picking a file through the Upload input starts the upload (a sign request is sent)', async () => {
    const signUrls: string[] = [];
    stubMediaExplorerFetch(); // tree + list
    stubR2Upload(); // the presigned PUT (an XHR)
    // Layer the sign endpoint on top of the explorer stub's fetch.
    const explorerFetch = globalThis.fetch as unknown as typeof fetch;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: Request | string, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('/media/uploads')) {
          signUrls.push(url);
          return Promise.resolve(
            new Response(
              JSON.stringify({
                success: true,
                message: 'ok',
                data: {
                  asset: makeAsset({ id: 'up1', status: 'pending' }),
                  upload: {
                    url: 'https://r2.example.com/put?sig=1',
                    method: 'PUT',
                    headers: { 'content-type': 'image/png' },
                    expiresAt: 'x',
                  },
                },
              }),
              { status: 200, headers: { 'content-type': 'application/json' } },
            ),
          );
        }
        return explorerFetch(input as Request, init);
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith(['manage']),
    });
    await screen.findByRole('button', { name: 'Upload files' });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.png', {
      type: 'image/png',
    });
    await user.upload(input, file);

    // The sign call MUST fire — its absence is the exact bug the owner hit.
    await waitFor(() => expect(signUrls.length).toBeGreaterThan(0));
  });

  it('someone without media.read sees nothing at all — there is no partial library', () => {
    stubMediaExplorerFetch({ assets: [makeAsset()] });
    renderWithProviders(<MediaExplorer mode="page" />, {
      store: storeWith([], ['developer']),
    });

    expect(
      screen.getByText(
        "You don't have permission to upload media. Ask an administrator.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('a1.png')).not.toBeInTheDocument();
  });
});
