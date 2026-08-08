import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role, SettingsCatalog } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastStore } from '../../../data/toast';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { SettingsPage } from './settings-page';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

const catalog: SettingsCatalog = {
  groups: [
    {
      group: 'branding',
      sections: [
        {
          section: 'identity',
          fields: [
            {
              key: 'branding.brand.name',
              type: 'localized_text',
              requirement: 'optional',
              value: { ar: 'سَنَد', en: 'Sanad' },
            },
            {
              key: 'branding.logoUrl',
              type: 'image',
              requirement: 'optional',
              value: null,
            },
          ],
        },
        {
          section: 'colors',
          fields: [
            {
              key: 'branding.colors.primary',
              type: 'color',
              requirement: 'optional',
              value: '#22d3ee',
            },
          ],
        },
      ],
    },
  ],
};

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  toastStore.reset();
  vi.unstubAllGlobals();
});

describe('SettingsPage (descriptor-driven)', () => {
  it('renders the group rail + section sub-tabs from the catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ success: true, message: 'ok', data: catalog }),
        ),
    );
    renderWithProviders(<SettingsPage />, { store: storeWith(['manage']) });

    // group rail
    expect(
      await screen.findByRole('button', { name: 'Visual identity' }),
    ).toBeInTheDocument();
    // section sub-tabs
    expect(screen.getByRole('tab', { name: 'Identity' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Colors' })).toBeInTheDocument();
    // the default (identity) section renders its typed fields
    expect(screen.getByText('Brand name')).toBeInTheDocument();
    expect(screen.getByText('Logo')).toBeInTheDocument();
  });

  it('saves only a changed field on the active section (per-section Save)', async () => {
    const puts: Array<Record<string, unknown>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: Request) => {
        if (input.method === 'PUT') {
          puts.push((await input.clone().json()) as Record<string, unknown>);
        }
        return jsonResponse({ success: true, message: 'ok', data: catalog });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />, { store: storeWith(['manage']) });

    await user.click(await screen.findByRole('tab', { name: 'Colors' }));
    const hex = screen.getByLabelText('Primary color');
    await user.clear(hex);
    await user.type(hex, '#ff0000');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toEqual({
      values: [{ key: 'branding.colors.primary', value: '#ff0000' }],
    });
  });
});
