import { screen } from '@testing-library/react';
import type { DashboardStats, Lead, Notification } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../../leads/i18n';
import '../../notifications/i18n';
import '../i18n';
import { DashboardPage } from './dashboard-page';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const lead: Lead = {
  id: 'l1',
  name: 'Layla Hassan',
  email: 'layla@example.com',
  phone: '+966501234567',
  company: 'Acme',
  budget: null,
  projectType: null,
  message: 'Hi',
  source: 'contact',
  locale: 'ar',
  status: 'new',
  createdAt: '2026-06-30T10:00:00.000Z',
  updatedAt: '2026-06-30T10:00:00.000Z',
};

const activity: Notification = {
  id: 'n1',
  channel: 'in_app',
  type: 'lead.created',
  payload: {
    leadId: 'l1',
    name: 'Layla Hassan',
    email: 'layla@example.com',
    phone: '+966501234567',
    company: null,
    projectType: null,
    message: 'Hi',
    source: 'contact',
    locale: 'ar',
  },
  readAt: null,
  createdAt: '2026-06-30T10:00:00.000Z',
};

const stats: DashboardStats = {
  counts: {
    leadsTotal: 10,
    leadsNew: 4,
    users: 5,
    services: 7,
    blogPosts: 3,
    unreadNotifications: 2,
  },
  recentLeads: [lead],
  recentActivity: [activity],
};

function stub(body: DashboardStats): void {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: body }),
      ),
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DashboardPage', () => {
  it('renders the stat cards from the counts', async () => {
    stub(stats);
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText('New leads')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Team members')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders the recent leads and recent activity', async () => {
    stub(stats);
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText('New leads')).toBeInTheDocument();
    expect(screen.getAllByText('Layla Hassan').length).toBeGreaterThan(0);
    expect(screen.getByText('New lead from Layla Hassan')).toBeInTheDocument();
  });

  it('shows the empty hints when there is no recent data', async () => {
    stub({ ...stats, recentLeads: [], recentActivity: [] });
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText('No leads yet.')).toBeInTheDocument();
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });
});
