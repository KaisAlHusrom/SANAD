import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MediaAsset, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmationRoot } from '../../../components/feedback';
import { confirmStore } from '../../../data/confirm';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { MediaPage } from '../index';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

const asset: MediaAsset = {
  id: 'a1',
  folderId: null,
  key: 'media/a1.png',
  url: 'https://cdn/a1.png',
  filename: 'a1.png',
  mimeType: 'image/png',
  size: 10,
  width: 100,
  height: 100,
  status: 'ready',
  alt: { ar: '', en: '' },
  createdAt: 'x',
  updatedAt: 'x',
};

/** Mock fetch: folders → `folders`, media list → `listBody` (status `listStatus`). */
function stubFetch(
  listBody: unknown,
  {
    folders = [],
    listStatus = 200,
  }: { folders?: unknown[]; listStatus?: number } = {},
) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: Request) => {
      if (input.url.includes('/media/folders')) {
        return Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: folders }),
        );
      }
      return Promise.resolve(jsonResponse(listBody, listStatus));
    }),
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  confirmStore.reset();
  vi.unstubAllGlobals();
});

describe('MediaPage (RenderGate + RBAC)', () => {
  it('shows the empty state when there are no assets', async () => {
    stubFetch({
      success: true,
      message: 'ok',
      data: {
        items: [],
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      },
    });
    renderWithProviders(<MediaPage />, { store: storeWith(['manage']) });

    expect(await screen.findByText('No media yet')).toBeInTheDocument();
  });

  it('renders the grid and the manage controls for media.manage', async () => {
    stubFetch({
      success: true,
      message: 'ok',
      data: {
        items: [asset],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
    });
    renderWithProviders(<MediaPage />, { store: storeWith(['manage']) });

    expect(await screen.findByText('a1.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New folder' }),
    ).toBeInTheDocument();
  });

  it('hides upload/new-folder/delete for a read-only user', async () => {
    stubFetch({
      success: true,
      message: 'ok',
      data: {
        items: [asset],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
    });
    renderWithProviders(<MediaPage />, {
      store: storeWith(['media.read'], ['developer']),
    });

    expect(await screen.findByText('a1.png')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upload' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New folder' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('opens the shared delete confirmation', async () => {
    stubFetch({
      success: true,
      message: 'ok',
      data: {
        items: [asset],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
    });
    const user = userEvent.setup();
    // The confirmation is rendered by the global ConfirmationRoot (mounted once in the
    // app shell); include it here so the click surfaces the dialog.
    renderWithProviders(
      <>
        <MediaPage />
        <ConfirmationRoot />
      </>,
      { store: storeWith(['manage']) },
    );

    await screen.findByText('a1.png');
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Delete file')).toBeInTheDocument();
  });

  it('shows a friendly message when storage is unconfigured (503)', async () => {
    stubFetch({ success: false, message: 'no' }, { listStatus: 503 });
    renderWithProviders(<MediaPage />, { store: storeWith(['manage']) });

    expect(
      await screen.findByText("Media storage isn't configured yet."),
    ).toBeInTheDocument();
  });
});
