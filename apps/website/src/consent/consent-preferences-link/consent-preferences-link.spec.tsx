import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_TRACKING_CONFIG } from '@sanad/contracts';
import { en } from '../../i18n/dictionaries/en';
import { ConsentProvider } from '../consent-provider/consent-provider';
import { consentUiStore } from '../consent-ui-store/consent-ui-store';
import { ConsentPreferencesLink } from './consent-preferences-link';

afterEach(() => {
  cleanup();
  consentUiStore.close();
});

const copy = en.consent.preferences;

describe('ConsentPreferencesLink', () => {
  // The point of the singleton store: in the real tree this button is inside the landing finale
  // and the dialog is a direct child of the shell. Rendering it with NO layer around it is the
  // spec of that independence.
  it('opens the dialog from a tree that contains no consent layer', async () => {
    const user = userEvent.setup();
    render(
      <ConsentProvider config={DEFAULT_TRACKING_CONFIG}>
        <ConsentPreferencesLink copy={copy} />
      </ConsentProvider>,
    );

    expect(consentUiStore.getSnapshot()).toBe(false);
    await user.click(screen.getByRole('button', { name: copy.open }));
    expect(consentUiStore.getSnapshot()).toBe(true);
  });

  it('takes the class its host footer gives it', () => {
    render(
      <ConsentProvider config={DEFAULT_TRACKING_CONFIG}>
        <ConsentPreferencesLink copy={copy} className="site-footer-link" />
      </ConsentProvider>,
    );
    expect(screen.getByRole('button', { name: copy.open })).toHaveClass(
      'site-footer-link',
    );
  });

  it('is absent when the operator switched consent off', () => {
    render(
      <ConsentProvider
        config={{
          consent: { ...DEFAULT_TRACKING_CONFIG.consent, bannerEnabled: false },
          destinations: [],
        }}
      >
        <ConsentPreferencesLink copy={copy} />
      </ConsentProvider>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
