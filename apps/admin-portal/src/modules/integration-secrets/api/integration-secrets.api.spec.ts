import { configureStore } from '@reduxjs/toolkit';
import type { SecretStatus } from '@sanad/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authReducer } from '../../../data/auth/auth.slice';
import { integrationSecretsApi } from './integration-secrets.api';

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [integrationSecretsApi.reducerPath]: integrationSecretsApi.reducer,
    },
    middleware: (getDefault) =>
      getDefault().concat(integrationSecretsApi.middleware),
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const smtpStatus: SecretStatus = {
  key: 'SMTP_PASSWORD',
  isSet: true,
  fromEnv: false,
  last4: '1234',
  updatedAt: '2026-06-25T00:00:00.000Z',
  updatedByUserId: 'u1',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('integrationSecretsApi', () => {
  it('lists masked statuses (GET /integration-secrets, envelope unwrapped)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: [smtpStatus] }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();

    const data = await store
      .dispatch(integrationSecretsApi.endpoints.listSecrets.initiate())
      .unwrap();

    expect(data).toEqual([smtpStatus]);
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.url).toContain('/integration-secrets');
    expect(request.method).toBe('GET');
  });

  it('sets a secret (PUT /integration-secrets/:key { value }) and never keeps plaintext', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: smtpStatus }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();

    const data = await store
      .dispatch(
        integrationSecretsApi.endpoints.setSecret.initiate({
          key: 'SMTP_PASSWORD',
          value: 'super-secret-value',
        }),
      )
      .unwrap();

    expect(data).toEqual(smtpStatus);
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.method).toBe('PUT');
    expect(request.url).toContain('/integration-secrets/SMTP_PASSWORD');
    await expect(request.clone().json()).resolves.toEqual({
      value: 'super-secret-value',
    });
    // the plaintext value is write-only — it must not linger in the cache/store
    expect(JSON.stringify(store.getState())).not.toContain(
      'super-secret-value',
    );
  });
});
