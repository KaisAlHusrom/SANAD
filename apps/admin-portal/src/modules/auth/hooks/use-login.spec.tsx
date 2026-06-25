import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../../../test/render-with-providers';
import { i18n } from '../../../i18n';
import { LoginForm } from '../index';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/" element={<div>dashboard</div>} />
    </Routes>,
    { route: '/login' },
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('login (use-login + LoginForm)', () => {
  it('blocks submit and shows a field error for an invalid email (F6)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Invalid email address'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs in, stores tokens, and navigates on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        message: 'ok',
        data: {
          tokens: { access: 'tok', refresh: 'r' },
          user: {
            id: 'u1',
            email: 'a@b.co',
            name: 'Admin',
            roles: ['admin'],
            isActive: true,
          },
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { store } = renderLogin();

    await user.type(screen.getByLabelText('Email'), 'admin@sanad.tech');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('dashboard')).toBeInTheDocument();
    await waitFor(() => {
      expect(store.getState().auth.access).toBe('tok');
    });
  });

  it('surfaces invalid-credentials on a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: false, message: 'no' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'admin@sanad.tech');
    await user.type(screen.getByLabelText('Password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Incorrect email or password'),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });
});
