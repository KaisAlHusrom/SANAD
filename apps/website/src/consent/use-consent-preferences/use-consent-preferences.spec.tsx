import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_TRACKING_CONFIG } from '@sanad/contracts';
import { CONSENT_STORAGE_KEY } from '../constants/consent.constants';
import { ConsentProvider } from '../consent-provider/consent-provider';
import { consentUiStore } from '../consent-ui-store/consent-ui-store';
import { useConsentPreferences } from './use-consent-preferences';

const NOW = 1_700_000_000_000;

function Probe() {
  const {
    draft,
    notStored,
    setCategory,
    acceptAll,
    rejectAll,
    save,
    withdraw,
  } = useConsentPreferences();
  return (
    <div>
      <span data-testid="draft">{`${draft.analytics}/${draft.marketing}`}</span>
      <span data-testid="notStored">{String(notStored)}</span>
      <button onClick={() => setCategory('analytics', !draft.analytics)}>
        flip analytics
      </button>
      <button onClick={acceptAll}>accept all</button>
      <button onClick={rejectAll}>reject all</button>
      <button onClick={save}>save</button>
      <button onClick={withdraw}>withdraw</button>
    </div>
  );
}

function show() {
  return render(
    <ConsentProvider config={DEFAULT_TRACKING_CONFIG}>
      <Probe />
    </ConsentProvider>,
  );
}

const stored = () =>
  JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null');

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
  consentUiStore.open();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
  consentUiStore.close();
});

describe('useConsentPreferences', () => {
  it('starts from what is currently granted — nothing, for a visitor who has not decided', () => {
    show();
    expect(screen.getByTestId('draft')).toHaveTextContent('false/false');
  });

  it('seeds from the existing decision when a decided visitor reopens it', () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        policyVersion: DEFAULT_TRACKING_CONFIG.consent.policyVersion,
        decidedAt: NOW,
        analytics: true,
        marketing: false,
      }),
    );
    show();
    expect(screen.getByTestId('draft')).toHaveTextContent('true/false');
  });

  // The draft is a DRAFT: flipping a switch must not quietly record consent before the visitor
  // presses save.
  it('does not record anything while the visitor is still choosing', async () => {
    const user = userEvent.setup();
    show();

    await user.click(screen.getByRole('button', { name: 'flip analytics' }));

    expect(screen.getByTestId('draft')).toHaveTextContent('true/false');
    expect(stored()).toBeNull();
  });

  it('records exactly the draft on save, and closes', async () => {
    const user = userEvent.setup();
    show();

    await user.click(screen.getByRole('button', { name: 'flip analytics' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(stored()).toMatchObject({ analytics: true, marketing: false });
    expect(consentUiStore.getSnapshot()).toBe(false);
  });

  it('accept-all and reject-all decide both categories at once and close', async () => {
    const user = userEvent.setup();
    show();

    await user.click(screen.getByRole('button', { name: 'accept all' }));
    expect(stored()).toMatchObject({ analytics: true, marketing: true });
    expect(consentUiStore.getSnapshot()).toBe(false);

    act(() => consentUiStore.open());
    await user.click(screen.getByRole('button', { name: 'reject all' }));
    expect(stored()).toMatchObject({ analytics: false, marketing: false });
  });

  it('goes back to asking on withdrawal, and closes', async () => {
    const user = userEvent.setup();
    show();
    await user.click(screen.getByRole('button', { name: 'accept all' }));
    act(() => consentUiStore.open());

    await user.click(screen.getByRole('button', { name: 'withdraw' }));

    expect(stored()).toBeNull();
    expect(consentUiStore.getSnapshot()).toBe(false);
  });

  // A browser that refuses to store is a click with a HALF outcome — the choice applies now and
  // vanishes with the tab. Saying so is the difference between honest and broken (U23).
  it('stays open and says so when the browser will not remember the choice', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    show();

    await user.click(screen.getByRole('button', { name: 'accept all' }));

    expect(screen.getByTestId('notStored')).toHaveTextContent('true');
    expect(consentUiStore.getSnapshot()).toBe(true);
  });
});
