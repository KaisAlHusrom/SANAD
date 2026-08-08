import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { ServiceItem } from '@sanad/contracts';

// framer-motion's whileInView needs IntersectionObserver (absent in jsdom) — passthrough the
// motion tags so specs assert CONTENT + structure, not the reveal animation.
vi.mock('framer-motion', () => {
  const passthrough =
    (Tag: string) =>
    ({ children, ...props }: { children?: unknown }) => {
      // Drop motion-only props so React doesn't warn on unknown DOM attributes.
      const { initial, animate, whileInView, viewport, transition, ...rest } =
        props as Record<string, unknown>;
      void initial;
      void animate;
      void whileInView;
      void viewport;
      void transition;
      const React = require('react');
      return React.createElement(Tag, rest, children);
    };
  return {
    motion: {
      div: passthrough('div'),
      li: passthrough('li'),
      article: passthrough('article'),
    },
  };
});

import { ServicesIndex } from './services-index';
import { ServiceDetail } from './service-detail';

function loc(ar: string, en = ar) {
  return { ar, en };
}

function service(overrides: Partial<ServiceItem> = {}): ServiceItem {
  return {
    id: overrides.slug ?? 'svc',
    slug: 'saas',
    iconKey: null,
    category: 'core',
    coverMediaId: null,
    sortOrder: 0,
    title: loc('منصّات SaaS', 'SaaS platforms'),
    summary: loc('منتجات سحابية', 'Cloud products'),
    detailBody: loc('', ''),
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

afterEach(cleanup);

describe('ServicesIndex', () => {
  it('renders core services as links to their detail page + the coded support/method/tech chrome', () => {
    const services = [
      service({ id: 's1', slug: 'saas', title: loc('SaaS', 'SaaS') }),
      service({ id: 's2', slug: 'mobile', title: loc('جوال', 'Mobile') }),
    ];
    render(<ServicesIndex services={services} locale="ar" />);

    const links = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.includes('/services/'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/ar/services/saas',
      '/ar/services/mobile',
    ]);
    // supporting capabilities (coded default) + method phase + a tech pill all render
    expect(screen.getByText('تصميم المنتج')).toBeTruthy();
    expect(screen.getByText('اكتشاف')).toBeTruthy();
    expect(screen.getByText('NestJS')).toBeTruthy();
  });

  it('shows an empty core state when there are no core services (F3), still rendering chrome', () => {
    render(<ServicesIndex services={[]} locale="en" />);
    expect(screen.getByText('Services are being prepared.')).toBeTruthy();
    // chrome (supporting capabilities) still present — never a blank page (WEB1/U9)
    expect(screen.getByText('Product design (UX/UI)')).toBeTruthy();
  });

  it('partitions support services out of the core grid', () => {
    const services = [
      service({ id: 'c', slug: 'saas', category: 'core' }),
      service({
        id: 'u',
        slug: 'ux',
        category: 'support',
        title: loc('X', 'X'),
      }),
    ];
    render(<ServicesIndex services={services} locale="ar" />);
    const coreLinks = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.includes('/services/'));
    expect(coreLinks).toHaveLength(1);
    expect(coreLinks[0]?.getAttribute('href')).toBe('/ar/services/saas');
  });
});

describe('ServiceDetail', () => {
  it('renders the entity title/summary, a breadcrumb, coded capabilities + related links', () => {
    const svc = service({ slug: 'saas', title: loc('منصّات', 'Platforms') });
    const related = [
      service({ id: 'r', slug: 'mobile', title: loc('جوال', 'Mobile') }),
    ];
    render(
      <ServiceDetail service={svc} related={related} coverUrl="" locale="en" />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Platforms' }),
    ).toBeTruthy();
    // reused landing capability copy (saas)
    expect(
      screen.getByText(/Multi-tenant architecture that scales/),
    ).toBeTruthy();
    // related link points to the other service
    const related1 = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/en/services/mobile');
    expect(related1).toBeTruthy();
  });

  it('renders the cover only when a url resolves — with none, the system planet is the visual (P8.D)', () => {
    const svc = service();
    const { container, rerender } = render(
      <ServiceDetail
        service={svc}
        related={[]}
        coverUrl="https://cdn.test/x.png"
        locale="ar"
      />,
    );
    const img = within(container).getByRole('img');
    expect(img.getAttribute('src')).toBe('https://cdn.test/x.png');

    rerender(
      <ServiceDetail service={svc} related={[]} coverUrl="" locale="ar" />,
    );
    expect(within(container).queryByRole('img')).toBeNull();
    // no placeholder box either — the WebGL close-orbit planet behind the page shows through
    expect(container.querySelector('.mk-detail-cover')).toBeNull();
  });
});
