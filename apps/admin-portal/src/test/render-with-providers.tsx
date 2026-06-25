import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import '../data/store/register-apis';
import { createAppStore } from '../data/store/store';
import type { AppStore } from '../data/store/types';
import { i18n } from '../i18n';

interface ProvidersOptions {
  store?: AppStore;
  route?: string;
}

/**
 * Render a UI tree inside the store + i18n + router providers (test util). Returns the
 * store; query the rendered output via the global `screen`.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: ProvidersOptions = {},
): { store: AppStore } {
  const store = options.store ?? createAppStore();
  const route = options.route ?? '/';

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </I18nextProvider>
      </Provider>
    );
  }

  render(ui, { wrapper: Wrapper });
  return { store };
}
