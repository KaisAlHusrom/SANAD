import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { Role } from '@sanad/contracts';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import '../../../data/store/register-apis';
import { i18n } from '../../../i18n';
import '../i18n';
import { BlogFormPage } from './blog-form-page';

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

/** The editor uses react-router's `useBlocker`, which requires a DATA router (not MemoryRouter). */
function renderAt(route: string) {
  const store = storeWith(['content.read', 'content.manage']);
  const router = createMemoryRouter(
    [{ path: '/content/blog/new', element: <BlogFormPage /> }],
    { initialEntries: [route] },
  );
  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>,
  );
}

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage('en');
});

describe('BlogFormPage', () => {
  it('renders the create editor with the form and a save action', () => {
    renderAt('/content/blog/new');
    expect(
      screen.getByRole('heading', { name: 'New post' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save post' }),
    ).toBeInTheDocument();
    // a slug field is part of the post form
    expect(screen.getByText('Slug')).toBeInTheDocument();
    // no draft banner on a clean create
    expect(screen.queryByText(/unsaved draft/i)).not.toBeInTheDocument();
  });
});
