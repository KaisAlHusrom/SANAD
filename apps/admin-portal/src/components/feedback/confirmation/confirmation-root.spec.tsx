import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmStore } from '../../../data/confirm';
import { i18n } from '../../../i18n';
import { ConfirmationRoot } from './confirmation-root';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  confirmStore.reset();
});

function renderRoot(): void {
  function Wrapper({ children }: { children: ReactNode }) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  }
  render(<ConfirmationRoot />, { wrapper: Wrapper });
}

describe('ConfirmationRoot', () => {
  it('renders the active confirmation with a default cancel label', async () => {
    renderRoot();

    act(() => {
      void confirmStore.request({
        title: 'Delete file',
        message: 'This cannot be undone.',
        variant: 'danger',
        confirmLabel: 'Delete',
      });
    });

    expect(await screen.findByText('Delete file')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('resolves true and closes when Confirm is clicked', async () => {
    const user = userEvent.setup();
    renderRoot();

    let result: Promise<boolean> = Promise.resolve(false);
    act(() => {
      result = confirmStore.request({
        title: 'Delete',
        message: 'Sure?',
        confirmLabel: 'Yes',
      });
    });

    await user.click(screen.getByRole('button', { name: 'Yes' }));

    expect(await result).toBe(true);
    await waitFor(() => {
      expect(screen.queryByText('Sure?')).not.toBeInTheDocument();
    });
  });

  it('resolves false when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderRoot();

    let result: Promise<boolean> = Promise.resolve(true);
    act(() => {
      result = confirmStore.request({ title: 'Delete', message: 'Sure?' });
    });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await result).toBe(false);
  });

  it('shows loading, then an inline error when onConfirm rejects, staying open', async () => {
    const user = userEvent.setup();
    renderRoot();

    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const onConfirm = vi.fn(async () => {
      await gate;
      throw new Error('Server error');
    });

    act(() => {
      void confirmStore.request({
        title: 'Delete',
        message: 'Remove it?',
        confirmLabel: 'Delete',
        onConfirm,
      });
    });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    });

    await act(async () => {
      release();
      await gate.catch(() => undefined);
    });

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByText('Remove it?')).toBeInTheDocument();
  });
});
