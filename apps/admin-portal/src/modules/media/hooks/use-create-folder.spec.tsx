import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../../../components/feedback';
import { GlobalModalManager } from '../../../components/modal';
import { clearModals, registerModal } from '../../../data/modal/modal-registry';
import { openModal } from '../../../data/modal/modal.slice';
import { createAppStore } from '../../../data/store/store';
import type { AppStore } from '../../../data/store/types';
import { toastStore } from '../../../data/toast';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
// Import via the module index so its i18n catalog registers (matches the auth pattern).
import { NEW_FOLDER_MODAL, NewFolderModal } from '../index';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
  registerModal({ component: NewFolderModal, types: [NEW_FOLDER_MODAL] });
});

afterEach(() => {
  clearModals();
  toastStore.reset();
  vi.unstubAllGlobals();
});

function openNewFolder(store: AppStore): void {
  renderWithProviders(
    <>
      <GlobalModalManager />
      <Toaster />
    </>,
    { store },
  );
  act(() => {
    store.dispatch(openModal({ type: NEW_FOLDER_MODAL }));
  });
}

describe('useCreateFolder + NewFolderModal (registry)', () => {
  it('POSTs the folder, toasts success, and closes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({
          success: true,
          message: 'ok',
          data: { id: 'f1', name: 'Logos' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    openNewFolder(createAppStore());

    await user.type(screen.getByLabelText('Folder name'), 'Logos');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Folder name')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('Folder created.')).toBeInTheDocument();
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.method).toBe('POST');
    expect(request.url).toContain('/media/folders');
  });

  it('keeps the dialog open with an inline + toast error on failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: false, message: 'Folder already exists' }, 409),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    openNewFolder(createAppStore());

    await user.type(screen.getByLabelText('Folder name'), 'Logos');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getAllByText('Folder already exists')).toHaveLength(2);
    });
    expect(screen.getByLabelText('Folder name')).toBeInTheDocument();
  });
});
