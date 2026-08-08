import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import type {
  PortfolioCategoryItem,
  PortfolioProjectItem,
} from '@sanad/contracts';

// framer-motion's whileInView needs IntersectionObserver (absent in jsdom) — passthrough the
// motion tags so specs assert CONTENT + structure, not the reveal animation.
vi.mock('framer-motion', () => {
  const passthrough =
    (Tag: string) =>
    ({ children, ...props }: { children?: unknown }) => {
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

import { PortfolioIndex } from './portfolio-index';
import { CaseStudy } from './case-study';

function loc(ar: string, en = ar) {
  return { ar, en };
}

function category(
  overrides: Partial<PortfolioCategoryItem> = {},
): PortfolioCategoryItem {
  return {
    id: overrides.slug ?? 'cat',
    slug: 'payments',
    sortOrder: 0,
    name: loc('مدفوعات', 'Payments'),
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

function project(
  overrides: Partial<PortfolioProjectItem> = {},
): PortfolioProjectItem {
  return {
    id: overrides.slug ?? 'prj',
    slug: 'raseed',
    category: category(),
    coverMediaId: null,
    clientName: 'Raseed',
    projectUrl: null,
    status: 'published',
    publishedAt: '2026-01-01',
    featured: false,
    sortOrder: 0,
    title: loc('رصيد', 'Raseed'),
    summary: loc('محفظة رقمية', 'A digital wallet'),
    challenge: loc('تحدّي الدفع', 'The payment challenge'),
    solution: loc('حلٌّ موحّد', 'A unified solution'),
    result: loc('1.2M عملية/شهر', '1.2M transactions/month'),
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

afterEach(cleanup);

describe('PortfolioIndex', () => {
  it('renders each case study as a link to its detail page + the coded chrome', () => {
    const projects = [
      project({ id: 'p1', slug: 'raseed', title: loc('رصيد', 'Raseed') }),
      project({ id: 'p2', slug: 'riaya', title: loc('رعاية', 'Riaya') }),
    ];
    render(<PortfolioIndex projects={projects} categories={[]} locale="ar" />);

    const links = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.includes('/portfolio/'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/ar/portfolio/raseed',
      '/ar/portfolio/riaya',
    ]);
    // the result metric renders on each card
    expect(screen.getAllByText('1.2M عملية/شهر')).toHaveLength(2);
  });

  it('shows an empty state when there are no case studies (F3), still rendering chrome', () => {
    render(<PortfolioIndex projects={[]} categories={[]} locale="en" />);
    expect(screen.getByText('Case studies are being prepared.')).toBeTruthy();
    // chrome (section head) still present — never a blank page (WEB1/U9)
    expect(screen.getByText('What we built')).toBeTruthy();
  });

  it('filters the grid by domain when a chip is pressed (client-side, no reload)', () => {
    const projects = [
      project({
        id: 'p1',
        slug: 'raseed',
        title: loc('رصيد', 'Raseed'),
        category: category({ id: 'pay', slug: 'payments' }),
      }),
      project({
        id: 'p2',
        slug: 'riaya',
        title: loc('رعاية', 'Riaya'),
        category: category({
          id: 'hea',
          slug: 'health',
          name: loc('صحة', 'Health'),
        }),
      }),
    ];
    const categories = [
      category({
        id: 'pay',
        slug: 'payments',
        name: loc('مدفوعات', 'Payments'),
      }),
      category({ id: 'hea', slug: 'health', name: loc('صحة', 'Health') }),
    ];
    render(
      <PortfolioIndex
        projects={projects}
        categories={categories}
        locale="en"
      />,
    );

    const detailLinks = () =>
      screen
        .getAllByRole('link')
        .filter((a) => a.getAttribute('href')?.includes('/portfolio/'));
    expect(detailLinks()).toHaveLength(2);

    // press the Health chip → only the health project remains
    fireEvent.click(screen.getByRole('button', { name: 'Health' }));
    const filtered = detailLinks();
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.getAttribute('href')).toBe('/en/portfolio/riaya');
    expect(
      screen
        .getByRole('button', { name: 'Health' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('offers a chip only for categories that actually have published projects', () => {
    const projects = [
      project({
        id: 'p1',
        slug: 'raseed',
        category: category({ slug: 'payments' }),
      }),
    ];
    const categories = [
      category({
        id: 'pay',
        slug: 'payments',
        name: loc('مدفوعات', 'Payments'),
      }),
      category({
        id: 'log',
        slug: 'logistics',
        name: loc('لوجستيات', 'Logistics'),
      }),
    ];
    render(
      <PortfolioIndex
        projects={projects}
        categories={categories}
        locale="en"
      />,
    );
    expect(screen.queryByRole('button', { name: 'Logistics' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Payments' })).toBeTruthy();
  });
});

describe('CaseStudy', () => {
  it('renders the entity title/summary + the three-act narrative + related links', () => {
    const prj = project({ slug: 'raseed', title: loc('رصيد', 'Raseed') });
    const related = [
      project({ id: 'r', slug: 'riaya', title: loc('رعاية', 'Riaya') }),
    ];
    render(
      <CaseStudy project={prj} related={related} coverUrl="" locale="en" />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Raseed' }),
    ).toBeTruthy();
    // the three acts (labels + bodies)
    expect(screen.getByRole('heading', { name: 'Challenge' })).toBeTruthy();
    expect(screen.getByText('The payment challenge')).toBeTruthy();
    expect(screen.getByText('A unified solution')).toBeTruthy();
    // the result appears both in the meta strip and as the third act body
    expect(
      screen.getAllByText('1.2M transactions/month').length,
    ).toBeGreaterThan(0);
    // related link points to the other case study
    const rel = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/en/portfolio/riaya');
    expect(rel).toBeTruthy();
  });

  it('renders the cover only when a url resolves — with none, the works planet is the visual (P8.E)', () => {
    const prj = project();
    const { container, rerender } = render(
      <CaseStudy
        project={prj}
        related={[]}
        coverUrl="https://cdn.test/x.png"
        locale="ar"
      />,
    );
    expect(within(container).getByRole('img').getAttribute('src')).toBe(
      'https://cdn.test/x.png',
    );

    rerender(<CaseStudy project={prj} related={[]} coverUrl="" locale="ar" />);
    expect(within(container).queryByRole('img')).toBeNull();
    expect(container.querySelector('.mk-detail-cover')).toBeNull();
  });
});
