import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../modules/auth/components/login-page';
import { SecretsPage } from '../modules/integration-secrets';
import { MediaPage } from '../modules/media';
import { BrandingPage } from '../modules/settings';
import { AppShell } from '../shell/components/app-shell';
import { RequireAuth } from './guards/require-auth';
import { RequirePermission } from './guards/require-permission';
import { PlaceholderPage } from './pages/placeholder-page';

/** The portal serves under `/admin/` (nginx); routes are gated by RequireAuth + RBAC. */
export const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    {
      element: <RequireAuth />,
      children: [
        {
          element: <AppShell />,
          children: [
            {
              path: '/',
              element: <PlaceholderPage titleKey="nav.dashboard" />,
            },
            {
              path: '/content',
              element: (
                <RequirePermission permission="content.read">
                  <PlaceholderPage titleKey="nav.content" />
                </RequirePermission>
              ),
            },
            {
              path: '/settings',
              element: (
                <RequirePermission permission="settings.manage">
                  <BrandingPage />
                </RequirePermission>
              ),
            },
            {
              path: '/settings/integrations',
              element: (
                <RequirePermission permission="settings.secrets.read">
                  <SecretsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/media',
              element: (
                <RequirePermission permission="media.read">
                  <MediaPage />
                </RequirePermission>
              ),
            },
            {
              path: '/leads',
              element: (
                <RequirePermission permission="content.manage">
                  <PlaceholderPage titleKey="nav.leads" />
                </RequirePermission>
              ),
            },
            {
              path: '/users',
              element: (
                <RequirePermission permission="identity.users.read">
                  <PlaceholderPage titleKey="nav.users" />
                </RequirePermission>
              ),
            },
          ],
        },
      ],
    },
  ],
  { basename: '/admin' },
);
