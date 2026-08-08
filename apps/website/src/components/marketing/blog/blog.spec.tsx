import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import type { BlogCategoryItem, BlogPostItem } from '@sanad/contracts';

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
      p: passthrough('p'),
      article: passthrough('article'),
    },
  };
});

import { BlogIndex } from './blog-index';
import { Post } from './post';

function loc(ar: string, en = ar) {
  return { ar, en };
}

function category(overrides: Partial<BlogCategoryItem> = {}): BlogCategoryItem {
  return {
    id: overrides.slug ?? 'cat',
    slug: 'engineering',
    sortOrder: 0,
    name: loc('الهندسة', 'Engineering'),
    description: loc('كيف نبني', 'How we build'),
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

function post(overrides: Partial<BlogPostItem> = {}): BlogPostItem {
  return {
    id: overrides.slug ?? 'b1',
    slug: 'weekly-owner-meetings',
    category: category(),
    author: { id: 'a1', slug: 'layan', name: loc('ليان', 'Layan') },
    tags: [{ id: 't1', slug: 'process', name: loc('آلية العمل', 'Process') }],
    coverMediaId: null,
    status: 'published',
    publishedAt: '2026-03-04T00:00:00.000Z',
    readMinutes: 4,
    sortOrder: 0,
    title: loc('اجتماع أسبوعي', 'A weekly meeting'),
    excerpt: loc('لقاء ثابت', 'A fixed weekly meeting'),
    body: loc(
      'الفقرة الأولى.\n\nالفقرة الثانية.',
      'First paragraph.\n\nSecond paragraph.',
    ),
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

afterEach(cleanup);

describe('BlogIndex', () => {
  it('renders each post as a link to its article + the coded chrome + the mono date', () => {
    const posts = [
      post({
        id: 'p1',
        slug: 'weekly-owner-meetings',
        title: loc('اجتماع', 'Weekly meetings'),
      }),
      post({
        id: 'p2',
        slug: 'we-stay-after-launch',
        title: loc('بعد الإطلاق', 'After launch'),
      }),
    ];
    render(<BlogIndex posts={posts} categories={[]} locale="en" />);

    const links = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.includes('/blog/'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/en/blog/weekly-owner-meetings',
      '/en/blog/we-stay-after-launch',
    ]);
    // the mono date stamp renders (ISO-sliced, N3), never `new Date()`
    expect(screen.getAllByText('2026.03.04')).toHaveLength(2);
  });

  it('shows an empty state when there are no posts (F3), still rendering chrome', () => {
    render(<BlogIndex posts={[]} categories={[]} locale="en" />);
    expect(
      screen.getByText(
        'The first entries are being written — check back soon.',
      ),
    ).toBeTruthy();
    // chrome (section head) still present — never a blank page (WEB1/U9)
    expect(screen.getByText('Latest writing')).toBeTruthy();
  });

  it('filters the grid by category when a chip is pressed (client-side, no reload)', () => {
    const posts = [
      post({
        id: 'p1',
        slug: 'weekly-owner-meetings',
        category: category({
          id: 'com',
          slug: 'company',
          name: loc('الشركة', 'Company'),
        }),
      }),
      post({
        id: 'p2',
        slug: 'one-identity',
        category: category({
          id: 'eng',
          slug: 'engineering',
          name: loc('الهندسة', 'Engineering'),
        }),
      }),
    ];
    const categories = [
      category({ id: 'com', slug: 'company', name: loc('الشركة', 'Company') }),
      category({
        id: 'eng',
        slug: 'engineering',
        name: loc('الهندسة', 'Engineering'),
      }),
    ];
    render(<BlogIndex posts={posts} categories={categories} locale="en" />);

    const articleLinks = () =>
      screen
        .getAllByRole('link')
        .filter((a) => a.getAttribute('href')?.includes('/blog/'));
    expect(articleLinks()).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Engineering' }));
    const filtered = articleLinks();
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.getAttribute('href')).toBe('/en/blog/one-identity');
    expect(
      screen
        .getByRole('button', { name: 'Engineering' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('offers a chip only for categories that actually have published posts', () => {
    const posts = [
      post({ id: 'p1', category: category({ slug: 'engineering' }) }),
    ];
    const categories = [
      category({
        id: 'eng',
        slug: 'engineering',
        name: loc('الهندسة', 'Engineering'),
      }),
      category({ id: 'com', slug: 'company', name: loc('الشركة', 'Company') }),
    ];
    render(<BlogIndex posts={posts} categories={categories} locale="en" />);
    expect(screen.queryByRole('button', { name: 'Company' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Engineering' })).toBeTruthy();
  });
});

describe('Post', () => {
  it('renders the title/excerpt + the prose body paragraphs + tags + related', () => {
    const p = post({
      slug: 'weekly-owner-meetings',
      title: loc('اجتماع', 'Weekly meetings'),
    });
    const related = [
      post({
        id: 'r',
        slug: 'after-launch',
        title: loc('بعد', 'After launch'),
      }),
    ];
    render(<Post post={p} related={related} coverUrl="" locale="en" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Weekly meetings' }),
    ).toBeTruthy();
    // the body splits into paragraphs on the blank line
    expect(screen.getByText('First paragraph.')).toBeTruthy();
    expect(screen.getByText('Second paragraph.')).toBeTruthy();
    // the tag renders
    expect(screen.getByText('Process')).toBeTruthy();
    // related link points to the other post
    const rel = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/en/blog/after-launch');
    expect(rel).toBeTruthy();
  });

  it('renders the cover only when a url resolves — with none, the Logbook planet is the visual (P8.E-3)', () => {
    const p = post();
    const { container, rerender } = render(
      <Post
        post={p}
        related={[]}
        coverUrl="https://cdn.test/x.png"
        locale="ar"
      />,
    );
    expect(within(container).getByRole('img').getAttribute('src')).toBe(
      'https://cdn.test/x.png',
    );

    rerender(<Post post={p} related={[]} coverUrl="" locale="ar" />);
    expect(within(container).queryByRole('img')).toBeNull();
    expect(container.querySelector('.mk-detail-cover')).toBeNull();
  });
});
