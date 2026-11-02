import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DEFAULT_TRACKING_CONFIG,
  type PublicConsentPolicy,
  type PublicTrackingConfig,
} from '@sanad/contracts';
import { ar } from '../../i18n/dictionaries/ar';
import { en } from '../../i18n/dictionaries/en';
import { CONSENT_STORAGE_KEY } from '../constants/consent.constants';
import { ConsentProvider } from '../consent-provider/consent-provider';
import { consentUiStore } from '../consent-ui-store/consent-ui-store';
import { ConsentBar } from './consent-bar';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  consentUiStore.close();
  vi.restoreAllMocks();
});

function show(
  over: Partial<PublicConsentPolicy> = {},
  locale: 'ar' | 'en' = 'en',
) {
  const config: PublicTrackingConfig = {
    consent: { ...DEFAULT_TRACKING_CONFIG.consent, ...over },
    destinations: [],
  };
  const copy = locale === 'ar' ? ar.consent : en.consent;
  return render(
    <ConsentProvider config={config}>
      <ConsentBar copy={copy} locale={locale} />
    </ConsentProvider>,
  );
}

const stored = () =>
  JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null');

describe('ConsentBar', () => {
  it('asks a visitor who has not decided, as a labelled region', () => {
    show();
    expect(
      screen.getByRole('region', { name: en.consent.bar.label }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.consent.bar.title)).toBeInTheDocument();
  });

  it('says nothing to a visitor who already decided', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        policyVersion: DEFAULT_TRACKING_CONFIG.consent.policyVersion,
        decidedAt: Date.now(),
        analytics: false,
        marketing: false,
      }),
    );
    show();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('says nothing at all when the operator switched the banner off', () => {
    show({ bannerEnabled: false });
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  // The owner's directive, asserted structurally so a later restyle cannot quietly demote reject
  // into a link while accept keeps the pill — the classic consent dark pattern.
  it('gives accept and reject identical visual weight', () => {
    show();
    const accept = screen.getByRole('button', {
      name: en.consent.bar.acceptAll,
    });
    const reject = screen.getByRole('button', {
      name: en.consent.bar.rejectAll,
    });
    expect(accept.className).toBe(reject.className);
    expect(accept.tagName).toBe(reject.tagName);
  });

  it('records all, or nothing, from the bar itself', async () => {
    const user = userEvent.setup();
    show();

    await user.click(
      screen.getByRole('button', { name: en.consent.bar.acceptAll }),
    );
    expect(stored()).toMatchObject({ analytics: true, marketing: true });
  });

  it('records a refusal as a real decision, not as silence', async () => {
    const user = userEvent.setup();
    show();

    await user.click(
      screen.getByRole('button', { name: en.consent.bar.rejectAll }),
    );
    expect(stored()).toMatchObject({ analytics: false, marketing: false });
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('hands a visitor who wants to choose over to the dialog', async () => {
    const user = userEvent.setup();
    show();

    await user.click(
      screen.getByRole('button', { name: en.consent.bar.customize }),
    );
    expect(consentUiStore.getSnapshot()).toBe(true);
  });

  describe('the policy links (F7 — both paths are nullable)', () => {
    it('renders no links, and no empty row, when the operator has set none', () => {
      const { container } = show();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(container.querySelector('.consent-bar-links')).toBeNull();
    });

    it('renders only the link that is set', () => {
      show({ privacyPolicyPath: '/privacy', cookiePolicyPath: null });
      expect(
        screen.getByRole('link', { name: en.consent.links.privacy }),
      ).toHaveAttribute('href', '/en/privacy');
      expect(
        screen.queryByRole('link', { name: en.consent.links.cookies }),
      ).not.toBeInTheDocument();
    });

    it('localizes a site path and leaves an external policy alone', () => {
      show(
        {
          privacyPolicyPath: '/legal/privacy',
          cookiePolicyPath: 'https://sanad.example/cookies',
        },
        'ar',
      );
      expect(
        screen.getByRole('link', { name: ar.consent.links.privacy }),
      ).toHaveAttribute('href', '/ar/legal/privacy');
      expect(
        screen.getByRole('link', { name: ar.consent.links.cookies }),
      ).toHaveAttribute('href', 'https://sanad.example/cookies');
    });
  });
});
