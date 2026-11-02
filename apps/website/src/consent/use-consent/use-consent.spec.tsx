import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import {
  CONSENT_REMEMBER_DAYS_DEFAULT,
  DEFAULT_TRACKING_CONFIG,
  type PublicConsentPolicy,
  type PublicTrackingConfig,
} from '@sanad/contracts';
import {
  CONSENT_STATUS_ATTRIBUTE,
  CONSENT_STORAGE_KEY,
  MS_PER_DAY,
} from '../constants/consent.constants';
import { ConsentProvider } from '../consent-provider/consent-provider';

import type { ConsentRecord } from '../types/consent-record.zod.types';
import { useConsent } from './use-consent';

const NOW = 1_700_000_000_000;

const policy = (
  over: Partial<PublicConsentPolicy> = {},
): PublicConsentPolicy => ({
  ...DEFAULT_TRACKING_CONFIG.consent,
  ...over,
});

const record = (over: Partial<ConsentRecord> = {}): ConsentRecord => ({
  v: 1,
  policyVersion: DEFAULT_TRACKING_CONFIG.consent.policyVersion,
  decidedAt: NOW,
  analytics: true,
  marketing: true,
  ...over,
});

function Probe() {
  const { status, granted, destinations, decide, withdraw } = useConsent();
  const [persisted, setPersisted] = useState<boolean | null>(null);
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="granted">
        {`${granted.necessary}/${granted.analytics}/${granted.marketing}`}
      </span>
      <span data-testid="destinations">
        {destinations.map((d) => d.id).join(',')}
      </span>
      <span data-testid="persisted">
        {persisted === null ? '' : String(persisted)}
      </span>
      <button
        onClick={() =>
          setPersisted(decide({ analytics: true, marketing: false }))
        }
      >
        analytics only
      </button>
      <button
        onClick={() =>
          setPersisted(decide({ analytics: true, marketing: true }))
        }
      >
        everything
      </button>
      <button onClick={withdraw}>withdraw</button>
    </div>
  );
}

const config = (
  over: Partial<PublicConsentPolicy> = {},
  destinations: PublicTrackingConfig['destinations'] = [],
): PublicTrackingConfig => ({ consent: policy(over), destinations });

const show = (
  over: Partial<PublicConsentPolicy> = {},
  destinations: PublicTrackingConfig['destinations'] = [],
) =>
  render(
    <ConsentProvider config={config(over, destinations)}>
      <Probe />
    </ConsentProvider>,
  );

const status = () => screen.getByTestId('status').textContent;
const granted = () => screen.getByTestId('granted').textContent;

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clearing storage is enough: the store reads through to it rather than holding a flag, so
  // there is no cache left to reset — and notifying a still-mounted component here would fire a
  // React update outside act().
  window.localStorage.clear();
  document.documentElement.removeAttribute(CONSENT_STATUS_ATTRIBUTE);
});

describe('useConsent', () => {
  it('asks a browser that has never decided, and grants only essentials', () => {
    show();

    expect(status()).toBe('pending');
    expect(granted()).toBe('true/false/false');
  });

  it('honours a decision this browser already carried in, with no re-ask', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(record({ analytics: true, marketing: false })),
    );
    show();

    expect(status()).toBe('decided');
    expect(granted()).toBe('true/true/false');
  });

  it('re-asks once the operator bumps the policy version', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(record({ policyVersion: 1 })),
    );
    show({ policyVersion: 2 });

    expect(status()).toBe('pending');
  });

  it('re-asks once the decision is older than rememberDays', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(
        record({ decidedAt: NOW - CONSENT_REMEMBER_DAYS_DEFAULT * MS_PER_DAY }),
      ),
    );
    show();

    expect(status()).toBe('pending');
  });

  it('grants nothing when the operator switched the banner off, over a stored grant', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record()));
    show({ bannerEnabled: false });

    expect(status()).toBe('not-required');
    expect(granted()).toBe('true/false/false');
  });

  describe('deciding', () => {
    it('applies the answer immediately and persists it against the CURRENT policy version', async () => {
      show({ policyVersion: 4 });

      await userEvent.click(
        screen.getByRole('button', { name: 'analytics only' }),
      );

      expect(status()).toBe('decided');
      expect(granted()).toBe('true/true/false');
      expect(
        JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? '{}'),
      ).toMatchObject({ policyVersion: 4, analytics: true, marketing: false });
    });

    it('survives a remount — the decision outlives the component', async () => {
      const first = show();
      await userEvent.click(screen.getByRole('button', { name: 'everything' }));
      first.unmount();

      show();

      expect(status()).toBe('decided');
      expect(granted()).toBe('true/true/true');
    });

    it('still applies when the browser refuses to persist it', async () => {
      // Safari private mode throws on setItem. Without an in-memory fallback the click produces
      // NOTHING — the banner can never be dismissed, which is the worst state a screen can ship
      // (U23). The decision must at least hold for this page view.
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      show();

      await userEvent.click(screen.getByRole('button', { name: 'everything' }));

      expect(status()).toBe('decided');
      expect(granted()).toBe('true/true/true');
      expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    });

    it('goes back to asking after a withdrawal', async () => {
      window.localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(record()),
      );
      show();

      await userEvent.click(screen.getByRole('button', { name: 'withdraw' }));

      expect(status()).toBe('pending');
      expect(granted()).toBe('true/false/false');
      expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    });
  });

  describe('another tab', () => {
    it('applies a decision made there, without a reload', () => {
      show();
      expect(status()).toBe('pending');

      const newValue = JSON.stringify(
        record({ analytics: false, marketing: true }),
      );
      act(() => {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, newValue);
        window.dispatchEvent(
          new StorageEvent('storage', { key: CONSENT_STORAGE_KEY, newValue }),
        );
      });

      expect(status()).toBe('decided');
      expect(granted()).toBe('true/false/true');
    });
  });

  describe('the <html data-consent> stamp', () => {
    it('reflects the status the provider resolved', () => {
      show();

      expect(
        document.documentElement.getAttribute(CONSENT_STATUS_ATTRIBUTE),
      ).toBe('pending');
    });

    it('stops lying the moment the visitor decides', async () => {
      show();

      await userEvent.click(screen.getByRole('button', { name: 'everything' }));

      expect(
        document.documentElement.getAttribute(CONSENT_STATUS_ATTRIBUTE),
      ).toBe('decided');
    });
  });

  describe('outside a provider', () => {
    it('falls back to the coded policy — ask, and grant nothing (F7)', () => {
      render(<Probe />);

      expect(status()).toBe('pending');
      expect(granted()).toBe('true/false/false');
      expect(screen.getByTestId('destinations').textContent).toBe('');
    });
  });

  // The dialog names the third parties a category would admit, so the list has to reach it —
  // and it is the same list A3's loaders read.
  describe('the destinations a decision actually admits', () => {
    it('carries the resolved list through the provider', () => {
      show({}, [
        { id: 'ga4', category: 'analytics', measurementId: 'G-ABCDE12345' },
        {
          id: 'metaPixel',
          category: 'marketing',
          measurementId: '1234567890123',
        },
      ]);

      expect(screen.getByTestId('destinations').textContent).toBe(
        'ga4,metaPixel',
      );
    });
  });

  describe('what decide() reports back', () => {
    it('says the answer was kept when the browser stored it', async () => {
      show();
      await userEvent.click(screen.getByRole('button', { name: 'everything' }));
      expect(screen.getByTestId('persisted').textContent).toBe('true');
    });

    it('says the answer was NOT kept when storage refused it', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      show();

      await userEvent.click(screen.getByRole('button', { name: 'everything' }));

      expect(status()).toBe('decided');
      expect(screen.getByTestId('persisted').textContent).toBe('false');
    });
  });
});
