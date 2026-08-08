import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../modules/auth/components/login-page';
import {
  BlogCategoriesPage,
  BlogFormPage,
  BlogPage,
  BlogTagsPage,
} from '../modules/blog';
import { ContentHubPage } from '../modules/content-hub';
import { DashboardPage } from '../modules/dashboard';
import { FaqsPage } from '../modules/faqs';
import { IntegrationsPage } from '../modules/integrations';
import { LeadsPage } from '../modules/leads';
import { MediaPage } from '../modules/media';
import { MenusPage } from '../modules/menus';
import { PageBuilderPage, PagesPage } from '../modules/pages';
import { PortfolioCategoriesPage, PortfolioPage } from '../modules/portfolio';
import { ServicesPage } from '../modules/services';
import { SettingsPage } from '../modules/settings';
import { TeamPage } from '../modules/team';
import { TestimonialsPage } from '../modules/testimonials';
import { UsersPage } from '../modules/users';
import { AppShell } from '../shell/components/app-shell';
import { RequireAuth } from './guards/require-auth';
import { RequirePermission } from './guards/require-permission';

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
              element: (
                <RequirePermission permission="content.read">
                  <DashboardPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content',
              element: (
                <RequirePermission permission="content.read">
                  <ContentHubPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/pages',
              element: (
                <RequirePermission permission="content.read">
                  <PagesPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/pages/:id',
              element: (
                <RequirePermission permission="content.read">
                  <PageBuilderPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/menus',
              element: (
                <RequirePermission permission="content.read">
                  <MenusPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/services',
              element: (
                <RequirePermission permission="content.read">
                  <ServicesPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/testimonials',
              element: (
                <RequirePermission permission="content.read">
                  <TestimonialsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/faqs',
              element: (
                <RequirePermission permission="content.read">
                  <FaqsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/team',
              element: (
                <RequirePermission permission="content.read">
                  <TeamPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/portfolio',
              element: (
                <RequirePermission permission="content.read">
                  <PortfolioPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/portfolio/categories',
              element: (
                <RequirePermission permission="content.read">
                  <PortfolioCategoriesPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/blog',
              element: (
                <RequirePermission permission="content.read">
                  <BlogPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/blog/categories',
              element: (
                <RequirePermission permission="content.read">
                  <BlogCategoriesPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/blog/tags',
              element: (
                <RequirePermission permission="content.read">
                  <BlogTagsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/blog/new',
              element: (
                <RequirePermission permission="content.read">
                  <BlogFormPage />
                </RequirePermission>
              ),
            },
            {
              path: '/content/blog/:id/edit',
              element: (
                <RequirePermission permission="content.read">
                  <BlogFormPage />
                </RequirePermission>
              ),
            },
            {
              path: '/settings',
              element: (
                <RequirePermission permission="settings.read">
                  <SettingsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/settings/integrations',
              element: (
                <RequirePermission permission="settings.integrations.read">
                  <IntegrationsPage />
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
                  <LeadsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/users',
              element: (
                <RequirePermission permission="identity.users.read">
                  <UsersPage />
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
