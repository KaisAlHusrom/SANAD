import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmationRoot, Toaster } from '../../../components/feedback';
import { confirmStore } from '../../../data/confirm';
import { toastStore } from '../../../data/toast';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
// Import via the module index so its i18n catalog registers (matches the auth pattern).
import { DeleteMediaButton } from '../index';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  confirmStore.reset();
  toastStore.reset();
  vi.unstubAllGlobals();
});

function renderHarness(): void {
  renderWithProviders(
    <>
      <DeleteMediaButton assetId="a1" />
      <ConfirmationRoot />
      <Toaster />
    </>,
  );
}

describe('useDeleteMedia + DeleteMediaButton', () => {
  it('confirms, DELETEs, toasts success, and closes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: { id: 'a1' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('File deleted.')).toBeInTheDocument();
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.method).toBe('DELETE');
    expect(request.url).toContain('/media/a1');
  });

  it('toasts an error and keeps the confirmation open on failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: false, message: 'nope' }, 500),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    // The message shows both inline in the dialog (role=alert) and in a toast.
    await waitFor(() => {
      expect(screen.getAllByText("Couldn't delete the file.")).toHaveLength(2);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
