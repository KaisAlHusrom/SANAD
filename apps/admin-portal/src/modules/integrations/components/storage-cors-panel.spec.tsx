import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role, StorageCorsStatus } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { StorageCorsPanel } from './storage-cors-panel';

/**
 * Every state of the CORS panel gets a test (U23). This panel exists BECAUSE a silent state cost
 * the owner a debugging session — so "it renders nothing" must never be an untested outcome.
 */

const POLICY: StorageCorsStatus['policy'] = [
  {
    allowedOrigins: ['http://localhost:8190'],
    allowedMethods: ['PUT', 'GET', 'HEAD'],
    allowedHeaders: ['content-type'],
    exposeHeaders: ['etag'],
    maxAgeSeconds: 3600,
  },
];

function status(overrides: Partial<StorageCorsStatus> = {}): StorageCorsStatus {
  return {
    state: 'missing',
    requiredOrigins: ['http://localhost:8190'],
    allowedOrigins: [],
    canApply: true,
    message: null,
    detail: null,
    policy: POLICY,
    ...overrides,
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * RTK Query's `fetchBaseQuery` calls `fetch(new Request(...))` — the verb is on the Request,
 * not on an `init` argument, so read it from whichever the caller used.
 */
function methodOf(input: unknown, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (input instanceof Request) return input.method.toUpperCase();
  return 'GET';
}

/** Serve the GET status; a POST (the fix) returns `postBody` if provided. */
function stubFetch(getBody: StorageCorsStatus, postBody?: StorageCorsStatus) {
  const fetchMock = vi.fn((input: unknown, init?: RequestInit) => {
    const isPost = methodOf(input, init) === 'POST';
    const data = isPost ? (postBody ?? getBody) : getBody;
    return Promise.resolve(
      jsonResponse({ success: true, message: 'ok', data }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function storeWith(
  permissions: string[] = ['manage'],
  roles: Role[] = ['admin'],
) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

function renderPanel(
  props: { configured?: boolean; canManage?: boolean } = {},
) {
  return renderWithProviders(
    <StorageCorsPanel
      provider="r2"
      configured={props.configured ?? true}
      canManage={props.canManage ?? true}
    />,
    { store: storeWith() },
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('StorageCorsPanel — every state renders', () => {
  it('`missing`: says browser uploads are blocked AND offers the one-click fix', async () => {
    stubFetch(status({ state: 'missing' }));
    renderPanel();

    expect(
      await screen.findByText(/browser uploads are blocked/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /configure cors/i }),
    ).toBeInTheDocument();
  });

  it('`ok`: says uploads are allowed and drops the fix button', async () => {
    stubFetch(
      status({
        state: 'ok',
        allowedOrigins: ['http://localhost:8190'],
        canApply: true,
      }),
    );
    renderPanel();

    expect(
      await screen.findByText(/browser uploads are allowed/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /configure cors/i }),
    ).not.toBeInTheDocument();
  });

  it('`origin-not-allowed`: names the origins the bucket DOES allow (diagnosable, not just a verdict)', async () => {
    stubFetch(
      status({
        state: 'origin-not-allowed',
        allowedOrigins: ['https://other.example'],
      }),
    );
    renderPanel();

    expect(
      await screen.findByText(/this origin isn't allowed/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/other\.example/)).toBeInTheDocument();
  });

  it('`cannot-check`: shows the provider reason + the manual instructions instead of a dead button', async () => {
    stubFetch(
      status({
        state: 'cannot-check',
        canApply: false,
        message: 'Access Denied',
      }),
    );
    renderPanel();

    expect(
      await screen.findByText(/couldn't read the bucket/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Access Denied/)).toBeInTheDocument();
    expect(screen.getByText(/paste it into Cloudflare/i)).toBeInTheDocument();
    // no button that we know would fail
    expect(
      screen.queryByRole('button', { name: /configure cors/i }),
    ).not.toBeInTheDocument();
    // …but the copy-the-policy escape hatch IS offered
    expect(
      screen.getByRole('button', { name: /copy policy/i }),
    ).toBeInTheDocument();
  });

  it('a failed CHECK is distinct from a blocked verdict, and offers a retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ success: false, message: 'boom', data: null }),
            { status: 500, headers: { 'content-type': 'application/json' } },
          ),
        ),
    );
    renderPanel();

    expect(
      await screen.findByText(/check couldn't be completed/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /re-check/i }),
    ).toBeInTheDocument();
  });

  it('pressing the fix writes the policy and reflects the RE-READ result', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(
      status({ state: 'missing' }),
      status({ state: 'ok', allowedOrigins: ['http://localhost:8190'] }),
    );
    renderPanel();

    await user.click(
      await screen.findByRole('button', { name: /configure cors/i }),
    );

    await waitFor(() => {
      const posted = fetchMock.mock.calls.some(
        ([input, init]) =>
          methodOf(input, init as RequestInit | undefined) === 'POST',
      );
      expect(posted).toBe(true);
    });
    // …and the panel now reads back the re-checked, fixed state
    expect(
      await screen.findByText(/browser uploads are allowed/i),
    ).toBeInTheDocument();
  });

  it('stays silent — and issues NO request — for an unconfigured provider', () => {
    const fetchMock = stubFetch(status());
    renderPanel({ configured: false });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stays silent for a viewer who cannot manage the integration', () => {
    const fetchMock = stubFetch(status());
    renderPanel({ canManage: false });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
