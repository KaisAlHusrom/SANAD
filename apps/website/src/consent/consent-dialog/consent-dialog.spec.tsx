import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DEFAULT_TRACKING_CONFIG,
  type PublicConsentPolicy,
  type PublicTrackingConfig,
} from '@sanad/contracts';
import { ar } from '../../i18n/dictionaries/ar';
import { en } from '../../i18n/dictionaries/en';
import { OVERLAY_HOST_SELECTOR } from '../../components/overlay';
import { CONSENT_STORAGE_KEY } from '../constants/consent.constants';
import { ConsentProvider } from '../consent-provider/consent-provider';
import { consentUiStore } from '../consent-ui-store/consent-ui-store';
import { ConsentDialog } from './consent-dialog';

const copy = en.consent;

const GA4 = {
  id: 'ga4',
  category: 'analytics',
  measurementId: 'G-ABCDE12345',
} as const;
const META = {
  id: 'metaPixel',
  category: 'marketing',
  measurementId: '1234567890123',
} as const;

beforeEach(() => {
  consentUiStore.open();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  consentUiStore.close();
  for (const host of document.querySelectorAll(OVERLAY_HOST_SELECTOR)) {
    host.remove();
  }
});

function show({
  policy = {},
  destinations = [],
  locale = 'en',
}: {
  policy?: Partial<PublicConsentPolicy>;
  destinations?: PublicTrackingConfig['destinations'];
  locale?: 'ar' | 'en';
} = {}) {
  const host = document.createElement('div');
  host.className = OVERLAY_HOST_SELECTOR.slice(1);
  document.body.append(host);

  const config: PublicTrackingConfig = {
    consent: { ...DEFAULT_TRACKING_CONFIG.consent, ...policy },
    destinations,
  };
  return render(
    <ConsentProvider config={config}>
      <ConsentDialog
        copy={locale === 'ar' ? ar.consent : en.consent}
        locale={locale}
      />
    </ConsentProvider>,
    { container: host },
  );
}

/** Each category is a labelled group, so a row can be addressed the way a visitor perceives it. */
const row = (category: 'necessary' | 'analytics' | 'marketing') =>
  within(screen.getByRole('group', { name: copy.categories[category].name }));

describe('ConsentDialog', () => {
  it('renders nothing while closed', () => {
    consentUiStore.close();
    show();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a labelled modal naming every category', () => {
    show();
    const dialog = screen.getByRole('dialog', { name: copy.dialog.title });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(
      within(dialog).getByText(copy.categories.necessary.name),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(copy.categories.analytics.name),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(copy.categories.marketing.name),
    ).toBeInTheDocument();
  });

  it('shows necessary as on and not the visitor’s to refuse', () => {
    show();
    const necessary = row('necessary').getByRole('switch');
    expect(necessary).toHaveAttribute('aria-checked', 'true');
    expect(necessary).toHaveAttribute('aria-disabled', 'true');
    expect(
      row('necessary').getByText(copy.categories.necessary.alwaysOn),
    ).toBeInTheDocument();
  });

  // The disclosure that makes the dialog worth opening: which third party this actually admits.
  it('names the destinations a category would really load', () => {
    show({ destinations: [GA4, META] });

    expect(
      row('analytics').getByText('Google Analytics 4'),
    ).toBeInTheDocument();
    expect(row('marketing').getByText('Meta pixel')).toBeInTheDocument();
    expect(row('analytics').queryByText('Meta pixel')).not.toBeInTheDocument();
  });

  it('says so honestly when a category has nothing configured behind it', () => {
    show({ destinations: [GA4] });

    expect(row('analytics').queryByText(copy.vendors.none)).toBeNull();
    expect(row('marketing').getByText(copy.vendors.none)).toBeInTheDocument();
  });

  it('never claims a vendor for the necessary category', () => {
    show({ destinations: [GA4, META] });
    expect(row('necessary').queryByText(copy.vendors.label)).toBeNull();
    expect(row('necessary').queryByText(copy.vendors.none)).toBeNull();
  });

  it('records exactly what the visitor toggled, and closes', async () => {
    const user = userEvent.setup();
    show();

    await user.click(row('analytics').getByRole('switch'));
    await user.click(screen.getByRole('button', { name: copy.dialog.save }));

    expect(
      JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null'),
    ).toMatchObject({ analytics: true, marketing: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape without recording anything', async () => {
    const user = userEvent.setup();
    show();

    await user.click(row('marketing').getByRole('switch'));
    await user.keyboard('{Escape}');

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('tells the visitor how long the answer is kept, in their own digits', () => {
    show({ policy: { rememberDays: 180 }, locale: 'ar' });
    expect(screen.getByText(/180/)).toBeInTheDocument();
  });

  it('offers a withdrawal only once there is something to withdraw', async () => {
    const user = userEvent.setup();
    const first = show();
    expect(
      screen.queryByRole('button', { name: copy.dialog.withdraw }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: copy.dialog.acceptAll }),
    );
    first.unmount();

    consentUiStore.open();
    show();
    expect(
      screen.getByRole('button', { name: copy.dialog.withdraw }),
    ).toBeInTheDocument();
  });

  it('never opens at all when the operator switched consent off', () => {
    show({ policy: { bannerEnabled: false } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
