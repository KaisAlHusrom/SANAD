import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastStore } from '../../../data/toast';
import { i18n } from '../../../i18n';
import { Toaster } from './toaster';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  toastStore.reset();
  vi.useRealTimers();
});

function renderToaster(): void {
  function Wrapper({ children }: { children: ReactNode }) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  }
  render(<Toaster />, { wrapper: Wrapper });
}

describe('Toaster', () => {
  it('renders an added toast, announced to assistive tech', async () => {
    renderToaster();

    act(() => {
      toastStore.add({ title: 'Saved', variant: 'success', duration: 0 });
    });

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('removes a toast when its close button is clicked', async () => {
    const user = userEvent.setup();
    renderToaster();

    act(() => {
      toastStore.add({ title: 'Saved', variant: 'success', duration: 0 });
    });
    await screen.findByText('Saved');

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses after the duration but keeps a 0-duration toast', () => {
    vi.useFakeTimers();
    renderToaster();

    act(() => {
      toastStore.add({ title: 'Transient', duration: 4000 });
      toastStore.add({ title: 'Sticky', duration: 0 });
    });
    expect(screen.getByText('Transient')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Transient')).not.toBeInTheDocument();
    expect(screen.getByText('Sticky')).toBeInTheDocument();
  });

  it('invokes an action button handler', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    renderToaster();

    act(() => {
      toastStore.add({
        title: 'Deleted',
        variant: 'info',
        duration: 0,
        action: { label: 'Undo', onClick: onAction },
      });
    });

    await user.click(await screen.findByRole('button', { name: 'Undo' }));

    expect(onAction).toHaveBeenCalledOnce();
  });
});
