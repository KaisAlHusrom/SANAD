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
import { SET_SECRET_MODAL, SetSecretModal } from '../index';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
  registerModal({ component: SetSecretModal, types: [SET_SECRET_MODAL] });
});

afterEach(() => {
  clearModals();
  toastStore.reset();
  vi.unstubAllGlobals();
});

function openSetSecret(store: AppStore): void {
  renderWithProviders(
    <>
      <GlobalModalManager />
      <Toaster />
    </>,
    { store },
  );
  act(() => {
    store.dispatch(
      openModal({
        type: SET_SECRET_MODAL,
        data: { key: 'SMTP_PASSWORD', isSet: false },
      }),
    );
  });
}

describe('useSetSecret + SetSecretModal (registry)', () => {
  it('blocks submit when the value is empty (F6 — no request fired)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    openSetSecret(createAppStore());

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('A value is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('PUTs the value, toasts success, and closes', async () => {
    const status = {
      key: 'SMTP_PASSWORD',
      isSet: true,
      fromEnv: false,
      last4: 'word',
      updatedAt: '2026-06-25T00:00:00.000Z',
      updatedByUserId: 'u1',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: status }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    openSetSecret(createAppStore());

    await user.type(screen.getByLabelText('Value'), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Value')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('Secret saved.')).toBeInTheDocument();
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.method).toBe('PUT');
    expect(request.url).toContain('/integration-secrets/SMTP_PASSWORD');
  });

  it('keeps the dialog open with an inline + toast error on failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: false, message: 'nope' }, 403),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    openSetSecret(createAppStore());

    await user.type(screen.getByLabelText('Value'), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Forbidden message shows both inline (role=alert) and as a toast.
    await waitFor(() => {
      expect(
        screen.getAllByText(
          "You don't have permission to manage this integration.",
        ),
      ).toHaveLength(2);
    });
    expect(screen.getByLabelText('Value')).toBeInTheDocument();
  });
});
