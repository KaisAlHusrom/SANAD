import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MediaAsset, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../data/auth/auth.slice';
import { createAppStore } from '../../data/store/store';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { MediaIdPickerField } from './media-id-picker-field';

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

const emptyPage = {
  success: true,
  message: 'ok',
  data: { items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
};

function stubFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: Request) => {
      if (input.url.includes('/media/a1')) {
        return Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: asset }),
        );
      }
      return Promise.resolve(jsonResponse(emptyPage));
    }),
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MediaIdPickerField', () => {
  it('resolves the selected id to a thumbnail preview', async () => {
    stubFetch();
    renderWithProviders(<MediaIdPickerField value="a1" onChange={vi.fn()} />, {
      store: storeWith(['manage']),
    });
    expect(await screen.findByText('a1.png')).toBeInTheDocument();
  });

  it('shows the empty label and no clear button when unset', () => {
    stubFetch();
    renderWithProviders(<MediaIdPickerField value="" onChange={vi.fn()} />, {
      store: storeWith(['manage']),
    });
    expect(screen.getByText('No image selected')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Clear' }),
    ).not.toBeInTheDocument();
  });

  it('clears the selection', async () => {
    stubFetch();
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<MediaIdPickerField value="a1" onChange={onChange} />, {
      store: storeWith(['manage']),
    });
    await screen.findByText('a1.png');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('hides the picker for a user without media.read', () => {
    stubFetch();
    renderWithProviders(<MediaIdPickerField value="" onChange={vi.fn()} />, {
      store: storeWith(['content.read'], ['developer']),
    });
    expect(
      screen.queryByRole('button', { name: 'Choose from library' }),
    ).not.toBeInTheDocument();
  });

  it('opens the media-library modal (browse + folders + upload) from the field', async () => {
    stubFetch();
    const user = userEvent.setup();
    renderWithProviders(<MediaIdPickerField value="" onChange={vi.fn()} />, {
      store: storeWith(['manage']),
    });
    await user.click(
      screen.getByRole('button', { name: 'Choose from library' }),
    );
    // the full explorer — folders, search and upload — not a bare thumbnail grid
    expect(await screen.findByText('Media library')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Folders' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New folder' }),
    ).toBeInTheDocument();
    // the toolbar's upload, and (while the library is empty) the empty state's own
    expect(
      screen.getAllByRole('button', { name: 'Upload files' }).length,
    ).toBeGreaterThan(0);
  });
});
