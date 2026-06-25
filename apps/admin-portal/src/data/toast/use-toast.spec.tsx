import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { toastStore } from './toast-store';
import { toast, useToast } from './use-toast';

afterEach(() => {
  toastStore.reset();
});

function Probe() {
  const { toasts } = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast.success('Saved')}>
        raise
      </button>
      <ul>
        {toasts.map((record) => (
          <li key={record.id}>
            {record.variant}:{record.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe('useToast', () => {
  it('exposes a raised toast to subscribed components', async () => {
    const user = userEvent.setup();
    render(<Probe />);

    await user.click(screen.getByRole('button', { name: 'raise' }));

    expect(await screen.findByText('success:Saved')).toBeInTheDocument();
  });

  it('raises exactly one toast per click under StrictMode', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    );

    await user.click(screen.getByRole('button', { name: 'raise' }));

    expect(await screen.findAllByText('success:Saved')).toHaveLength(1);
  });

  it('toast.promise shows a loading toast, then flips to success on resolve', async () => {
    let resolveIt: (value: string) => void = () => undefined;
    const promise = new Promise<string>((resolve) => {
      resolveIt = resolve;
    });

    act(() => {
      toast.promise(promise, {
        loading: 'Saving…',
        success: 'Saved',
        error: 'Failed',
      });
    });
    expect(toastStore.getSnapshot()[0]).toMatchObject({
      variant: 'loading',
      title: 'Saving…',
    });

    await act(async () => {
      resolveIt('ok');
      await promise;
    });
    expect(toastStore.getSnapshot()[0]).toMatchObject({
      variant: 'success',
      title: 'Saved',
    });
  });

  it('toast.promise flips to error on rejection (message derived from the error)', async () => {
    let rejectIt: (error: unknown) => void = () => undefined;
    const promise = new Promise<string>((_resolve, reject) => {
      rejectIt = reject;
    });

    act(() => {
      toast.promise(promise, {
        loading: 'Saving…',
        success: 'Saved',
        error: (error) => `Failed: ${String(error)}`,
      });
    });

    await act(async () => {
      rejectIt('boom');
      await promise.catch(() => undefined);
    });
    expect(toastStore.getSnapshot()[0]).toMatchObject({
      variant: 'error',
      title: 'Failed: boom',
    });
  });
});
