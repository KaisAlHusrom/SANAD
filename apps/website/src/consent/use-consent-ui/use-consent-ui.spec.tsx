import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { consentUiStore } from '../consent-ui-store/consent-ui-store';
import { useConsentUi } from './use-consent-ui';

afterEach(() => {
  cleanup();
  consentUiStore.close();
});

function Opener() {
  const { openDialog } = useConsentUi();
  return (
    <button type="button" onClick={openDialog}>
      preferences
    </button>
  );
}

function Watcher() {
  const { dialogOpen, closeDialog } = useConsentUi();
  return (
    <div>
      <span data-testid="open">{String(dialogOpen)}</span>
      <button type="button" onClick={closeDialog}>
        close
      </button>
    </div>
  );
}

describe('useConsentUi', () => {
  it('starts closed', () => {
    render(<Watcher />);
    expect(screen.getByTestId('open')).toHaveTextContent('false');
  });

  // The whole reason the store exists: these two are siblings here, but in the real tree one is
  // inside the landing finale and the other is a direct child of the shell.
  it('lets an opener in one subtree open the dialog a watcher in another is showing', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Opener />
        <Watcher />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'preferences' }));
    expect(screen.getByTestId('open')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.getByTestId('open')).toHaveTextContent('false');
  });
});
