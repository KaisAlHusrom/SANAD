import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DEFAULT_TRACKING_CONFIG,
  type PublicTrackingConfig,
} from '@sanad/contracts';

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/en' } }));
vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));

import { en } from '../../i18n/dictionaries/en';
import { OVERLAY_HOST_SELECTOR } from '../../components/overlay';
import { CONSENT_STORAGE_KEY } from '../constants/consent.constants';
import { ConsentProvider } from '../consent-provider/consent-provider';
import { ConsentPreferencesLink } from '../consent-preferences-link/consent-preferences-link';
import { consentUiStore } from '../consent-ui-store/consent-ui-store';
import { ConsentLayer } from './consent-layer';

const copy = en.consent;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  consentUiStore.close();
  pathname.current = '/en';
  for (const host of document.querySelectorAll(OVERLAY_HOST_SELECTOR)) {
    host.remove();
  }
});

function show(config: PublicTrackingConfig = DEFAULT_TRACKING_CONFIG) {
  const host = document.createElement('div');
  host.className = OVERLAY_HOST_SELECTOR.slice(1);
  document.body.append(host);
  return render(
    <ConsentProvider config={config}>
      {/* Stands in for the footer link, which in the real tree is oceans away from the layer. */}
      <ConsentPreferencesLink copy={copy.preferences} />
      <ConsentLayer copy={copy} locale="en" />
    </ConsentProvider>,
    { container: host },
  );
}

const stored = () =>
  JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null');

describe('ConsentLayer', () => {
  it('walks a visitor from the bar, through the dialog, to a recorded per-category choice', async () => {
    const user = userEvent.setup();
    show();

    // 1. asked
    expect(
      screen.getByRole('region', { name: copy.bar.label }),
    ).toBeInTheDocument();

    // 2. wants to choose
    await user.click(screen.getByRole('button', { name: copy.bar.customize }));
    const dialog = screen.getByRole('dialog', { name: copy.dialog.title });
    expect(dialog).toHaveFocus();

    // 3. grants analytics only
    await user.click(
      screen
        .getByRole('group', { name: copy.categories.analytics.name })
        .querySelector('[role="switch"]') as HTMLElement,
    );
    await user.click(screen.getByRole('button', { name: copy.dialog.save }));

    // 4. recorded, dialog gone, and never asked again
    expect(stored()).toMatchObject({ analytics: true, marketing: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: copy.bar.label }),
    ).not.toBeInTheDocument();
  });

  it('lets a decided visitor reopen the dialog from the footer and see their own answer', async () => {
    const user = userEvent.setup();
    show();
    await user.click(screen.getByRole('button', { name: copy.bar.acceptAll }));

    await user.click(
      screen.getByRole('button', { name: copy.preferences.open }),
    );

    const analytics = screen
      .getByRole('group', { name: copy.categories.analytics.name })
      .querySelector('[role="switch"]');
    expect(analytics).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('button', { name: copy.dialog.withdraw }),
    ).toBeInTheDocument();
  });

  it('closes the dialog when a link inside it navigates the site', async () => {
    const user = userEvent.setup();
    const view = show();
    await user.click(screen.getByRole('button', { name: copy.bar.customize }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    pathname.current = '/en/privacy';
    view.rerender(
      <ConsentProvider config={DEFAULT_TRACKING_CONFIG}>
        <ConsentPreferencesLink copy={copy.preferences} />
        <ConsentLayer copy={copy} locale="en" />
      </ConsentProvider>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows nothing whatsoever when the operator switched consent off', () => {
    show({
      consent: { ...DEFAULT_TRACKING_CONFIG.consent, bannerEnabled: false },
      destinations: [],
    });

    expect(
      screen.queryByRole('region', { name: copy.bar.label }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: copy.preferences.open }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
