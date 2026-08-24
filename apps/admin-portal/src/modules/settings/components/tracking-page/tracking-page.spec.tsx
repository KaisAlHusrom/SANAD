import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CONSENT_SETTING_KEYS,
  TRACKING_GROUP,
  TRACKING_SECTION_CONSENT,
  TRACKING_SECTION_DESTINATIONS,
  TRACKING_DESTINATIONS,
  trackingDestinationSettingKeys,
  type SettingField,
  type SettingsCatalog,
  type SettingsUpdateRequest,
} from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../../data/auth/auth.slice';
import { createAppStore } from '../../../../data/store/store';
import { i18n } from '../../../../i18n';
import { ConfirmationRoot } from '../../../../components/feedback/confirmation';
import { renderWithProviders } from '../../../../test/render-with-providers';
import '../../i18n';
import { TrackingPage } from './tracking-page';

const ga4 = trackingDestinationSettingKeys('ga4');
const gtm = trackingDestinationSettingKeys('gtm');

function field(
  key: string,
  type: SettingField['type'],
  value: SettingField['value'],
  extra: Partial<SettingField> = {},
): SettingField {
  return { key, type, requirement: 'optional', value, ...extra };
}

/** The catalog as the gateway returns it: every declared key with its resolved value. */
function catalog(
  overrides: Record<string, SettingField['value']> = {},
): SettingsCatalog {
  const at = (key: string, fallback: SettingField['value']) =>
    key in overrides ? (overrides[key] ?? null) : fallback;
  const consent: SettingField[] = [
    field(
      CONSENT_SETTING_KEYS.bannerEnabled,
      'boolean',
      at(CONSENT_SETTING_KEYS.bannerEnabled, true),
    ),
    field(
      CONSENT_SETTING_KEYS.policyVersion,
      'number',
      at(CONSENT_SETTING_KEYS.policyVersion, 1),
      { min: 1, max: 1_000_000 },
    ),
    field(
      CONSENT_SETTING_KEYS.rememberDays,
      'number',
      at(CONSENT_SETTING_KEYS.rememberDays, 180),
      { min: 1, max: 730 },
    ),
    field(
      CONSENT_SETTING_KEYS.privacyPolicyPath,
      'text',
      at(CONSENT_SETTING_KEYS.privacyPolicyPath, null),
    ),
    field(
      CONSENT_SETTING_KEYS.cookiePolicyPath,
      'text',
      at(CONSENT_SETTING_KEYS.cookiePolicyPath, null),
    ),
  ];
  const destinations = TRACKING_DESTINATIONS.flatMap(
    (destination): SettingField[] => {
      const keys = trackingDestinationSettingKeys(destination.id);
      return [
        field(keys.enabled, 'boolean', at(keys.enabled, false)),
        field(keys.id, 'text', at(keys.id, null), {
          pattern: destination.idPattern,
          patternExample: destination.idExample,
        }),
      ];
    },
  );
  return {
    groups: [
      {
        group: 'branding',
        sections: [
          {
            section: 'seo',
            fields: [
              field('branding.seo.siteUrl', 'url', 'https://sanad.example'),
            ],
          },
        ],
      },
      {
        group: TRACKING_GROUP,
        sections: [
          { section: TRACKING_SECTION_CONSENT, fields: consent },
          { section: TRACKING_SECTION_DESTINATIONS, fields: destinations },
        ],
      },
    ],
  };
}

const sent: SettingsUpdateRequest[] = [];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** `overrides` seeds the resolved catalog; `onWrite` decides what a PUT answers. */
function stubApi(
  overrides: Record<string, SettingField['value']> = {},
  onWrite: () => Response = () =>
    jsonResponse({ success: true, message: 'ok', data: catalog() }),
) {
  sent.length = 0;
  vi.stubGlobal(
    'fetch',
    // RTK Query's fetchBaseQuery calls `fetch(new Request(...))` — the method and body live on
    // the Request, not on an `init` argument that is never passed.
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : null;
      const method = (request?.method ?? init?.method ?? 'GET').toUpperCase();
      if (method === 'PUT') {
        const body = request ? await request.text() : String(init?.body);
        sent.push(JSON.parse(body) as SettingsUpdateRequest);
        return onWrite();
      }
      return jsonResponse({
        success: true,
        message: 'ok',
        data: catalog(overrides),
      });
    }),
  );
}

function adminStore() {
  const store = createAppStore();
  store.dispatch(
    identityLoaded({ userId: 'u', roles: ['admin'], permissions: ['manage'] }),
  );
  return store;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('TrackingPage', () => {
  it('renders one card per destination with its gating category', async () => {
    stubApi();
    renderWithProviders(<TrackingPage />, { store: adminStore() });

    expect(await screen.findByText('Google Analytics 4')).toBeInTheDocument();
    expect(screen.getByText('Meta pixel')).toBeInTheDocument();
    expect(screen.getByText('TikTok pixel')).toBeInTheDocument();
    expect(screen.getAllByText('Analytics').length).toBe(2); // GA4 + GTM
    expect(screen.getAllByText('Marketing').length).toBe(3);
  });

  it('starts with every destination off, so nothing loads on a fresh install', async () => {
    stubApi();
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    await screen.findByText('Google Analytics 4');
    expect(screen.getAllByText('Off').length).toBe(
      TRACKING_DESTINATIONS.length,
    );
  });

  /**
   * The state a plain toggle hides. "On with nothing to send" must be named on screen, or an
   * operator switches a destination on, walks away, and finds out weeks later.
   */
  it('names a destination that is switched on with no ID yet', async () => {
    stubApi({ [ga4.enabled]: true });
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    expect(await screen.findByText('No ID yet')).toBeInTheDocument();
  });

  it('shows a configured destination as live', async () => {
    stubApi({ [ga4.enabled]: true, [ga4.id]: 'G-ABCDE12345' });
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    expect(await screen.findByText('Live')).toBeInTheDocument();
  });

  it('refuses another vendor’s ID inline and saves NOTHING (U22)', async () => {
    const user = userEvent.setup();
    stubApi({ [ga4.enabled]: true, [ga4.id]: 'G-ABCDE12345' });
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    await screen.findByText('Google Analytics 4');

    const input = screen.getByLabelText('ID', { selector: '#destination-ga4' });
    await user.clear(input);
    await user.type(input, 'GTM-ABCDE12');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText(/doesn’t look like a valid ID/),
    ).toBeInTheDocument();
    // A blocked submit is never a silent no-op — it says so where the click happened…
    expect(
      screen.getByText('Nothing was saved — fix the highlighted fields first.'),
    ).toBeInTheDocument();
    // …and nothing reached the server.
    expect(sent).toEqual([]);
  });

  it('sends ONLY the keys that changed', async () => {
    const user = userEvent.setup();
    stubApi();
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    await screen.findByText('Google Analytics 4');

    await user.click(screen.getByLabelText('Enable Google Analytics 4'));
    await user.type(
      screen.getByLabelText('ID', { selector: '#destination-ga4' }),
      'G-ABCDE12345',
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.values).toEqual([
      { key: ga4.enabled, value: true },
      { key: ga4.id, value: 'G-ABCDE12345' },
    ]);
  });

  it('surfaces the server’s own reason when a save fails (U23a)', async () => {
    const user = userEvent.setup();
    stubApi({}, () =>
      jsonResponse(
        {
          success: false,
          message: 'Setting has the wrong format.',
          data: null,
        },
        400,
      ),
    );
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    await screen.findByText('Google Analytics 4');

    await user.click(screen.getByLabelText('Enable Google Analytics 4'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('Setting has the wrong format.'),
    ).toBeInTheDocument();
  });

  it('warns when GA4 and Tag Manager are both on — every session would count twice', async () => {
    stubApi({
      [ga4.enabled]: true,
      [ga4.id]: 'G-ABCDE12345',
      [gtm.enabled]: true,
      [gtm.id]: 'GTM-ABCDE12',
    });
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    expect(
      await screen.findByText(/every session is counted twice/),
    ).toBeInTheDocument();
    // …and the container caveat, which the consent gate genuinely cannot cover.
    expect(
      screen.getByText(/loaded by Tag Manager, not by this platform/),
    ).toBeInTheDocument();
  });

  it('warns that an unset policy link means the banner renders without one', async () => {
    stubApi();
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    await screen.findByText('Google Analytics 4');
    expect(
      screen.getAllByText(/the banner will render without this link/).length,
    ).toBe(2);
  });

  it('previews where a policy link will actually take a visitor, locale segment included', async () => {
    stubApi({ [CONSENT_SETTING_KEYS.privacyPolicyPath]: '/privacy' });
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    await screen.findByText('Google Analytics 4');
    expect(
      screen.getByText('https://sanad.example/en/privacy'),
    ).toBeInTheDocument();
  });

  it('says plainly that switching the banner off leaves every destination dormant', async () => {
    stubApi({ [CONSENT_SETTING_KEYS.bannerEnabled]: false });
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    expect(await screen.findByText(/nobody is asked/)).toBeInTheDocument();
  });

  it('raises the policy version behind a confirmation that says what it does', async () => {
    const user = userEvent.setup();
    stubApi({ [CONSENT_SETTING_KEYS.policyVersion]: 3 });
    renderWithProviders(
      <>
        <TrackingPage />
        <ConfirmationRoot />
      </>,
      { store: adminStore() },
    );
    await screen.findByText('Google Analytics 4');

    await user.click(
      screen.getByRole('button', { name: 'Ask everyone again' }),
    );
    expect(
      await screen.findByText(/Existing decisions stop applying immediately/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Raise the version' }));

    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.values).toEqual([
      { key: CONSENT_SETTING_KEYS.policyVersion, value: 4 },
    ]);
  });

  // Bumping refetches and re-baselines the form, which would silently discard whatever the
  // operator was in the middle of typing.
  it('blocks the version bump while there are unsaved changes, and says why', async () => {
    const user = userEvent.setup();
    stubApi();
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    await screen.findByText('Google Analytics 4');

    await user.click(screen.getByLabelText('Enable Google Analytics 4'));

    expect(
      screen.getByRole('button', { name: 'Ask everyone again' }),
    ).toBeDisabled();
    expect(
      screen.getByText('Save your changes before asking everyone again.'),
    ).toBeInTheDocument();
  });

  it('offers a retry when the catalog cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: false, message: 'nope' }, 500)),
    );
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });

  it('explains an absent tracking group instead of rendering controls bound to nothing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ success: true, message: 'ok', data: { groups: [] } }),
      ),
    );
    renderWithProviders(<TrackingPage />, { store: adminStore() });
    expect(
      await screen.findByText('Tracking settings aren’t available yet'),
    ).toBeInTheDocument();
  });
});
