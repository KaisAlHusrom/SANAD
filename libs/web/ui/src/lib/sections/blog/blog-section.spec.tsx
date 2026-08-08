import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { blogPostItem, loc, section } from '../../../test/fixtures.js';
import { EditProvider } from '../../editable/edit-context.js';
import { SectionBlock } from '../../section-renderer/section-block.js';
import { BlogSection } from './blog-section.js';
import { logStamp } from './derive-blog-posts.js';

/** A `blog` section linked to a hydrated `blog` collection of 2 posts. */
const blogSection = () =>
  section({
    type: 'blog',
    eyebrow: loc('', '07 · SHIP’S LOG'),
    title: loc('', 'What we learn as we build'),
    collection: {
      collection: 'blog',
      items: [
        blogPostItem({
          slug: 'post-one',
          coverMediaId: 'media-cover',
          publishedAt: '2026-03-14T00:00:00.000Z',
          title: loc('مقالة واحد', 'Post One'),
          excerpt: loc('مقتطف', 'Excerpt one'),
        }),
        blogPostItem({
          slug: 'post-two',
          category: null,
          publishedAt: '2026-02-01T00:00:00.000Z',
          title: loc('مقالة اثنان', 'Post Two'),
        }),
      ],
    },
  });

describe('logStamp', () => {
  it('formats an ISO date to the mono YYYY.MM.DD stamp, blank when unpublished (N3)', () => {
    expect(logStamp('2026-03-14T00:00:00.000Z')).toBe('2026.03.14');
    expect(logStamp(null)).toBe('');
  });
});

describe('BlogSection', () => {
  it('renders the head + one log row per hydrated post with date/category/title', () => {
    const { container } = render(
      <BlogSection section={blogSection()} locale="en" mode="live" />,
    );
    expect(container.querySelector('.web-log-section')).toBeInTheDocument();
    expect(container.querySelector('.web-log-eyebrow')?.textContent).toBe(
      '07 · SHIP’S LOG',
    );
    const rows = container.querySelectorAll('.web-log-row');
    expect(rows).toHaveLength(2);
    expect(
      [...container.querySelectorAll('.web-log-date')].map(
        (n) => n.textContent,
      ),
    ).toEqual(['2026.03.14', '2026.02.01']);
    expect(container.querySelector('.web-log-title')?.textContent).toBe(
      'Post One',
    );
    // the "all articles →" link shows only when there are rows
    expect(container.querySelector('.web-link-arrow')).toBeInTheDocument();
  });

  it('bakes the cover url server-side (resolveImageUrl) → a thumbnail on the covered row only', () => {
    const { container } = render(
      <BlogSection
        section={blogSection()}
        locale="en"
        mode="live"
        resolveImageUrl={(mediaId) => `https://cdn/${mediaId}.webp`}
      />,
    );
    const covers = container.querySelectorAll('img.web-log-cover-img');
    expect(covers).toHaveLength(1);
    expect(covers[0]?.getAttribute('src')).toBe('https://cdn/media-cover.webp');
  });

  it('injects the RowLink (per-row) + AllLink (header) client refs when provided', () => {
    const RowLink = ({
      slug,
      className,
      children,
    }: {
      slug: string;
      className?: string;
      children: React.ReactNode;
    }) => (
      <a data-row-link className={className} href={`/en/blog/${slug}`}>
        {children}
      </a>
    );
    const AllLink = ({
      className,
      children,
    }: {
      className?: string;
      children: React.ReactNode;
    }) => (
      <a data-all-link className={className} href="/en/blog">
        {children}
      </a>
    );
    const { container } = render(
      <BlogSection
        section={blogSection()}
        locale="en"
        mode="live"
        RowLink={RowLink}
        AllLink={AllLink}
      />,
    );
    const rowLinks = container.querySelectorAll('a[data-row-link]');
    expect(rowLinks).toHaveLength(2);
    expect(rowLinks[0]?.getAttribute('href')).toBe('/en/blog/post-one');
    expect(
      container.querySelector('a[data-all-link]')?.getAttribute('href'),
    ).toBe('/en/blog');
  });

  it('shows the explicit empty state (never null) when no posts are linked (F3)', () => {
    const empty = section({ type: 'blog', eyebrow: loc('', '07 · LOG') });
    const { container } = render(
      <BlogSection section={empty} locale="en" mode="live" />,
    );
    // unlike works/trust, the blog section is always present with an empty state
    expect(container.querySelector('.web-log-section')).toBeInTheDocument();
    expect(container.querySelector('.web-empty')).toBeInTheDocument();
    expect(container.querySelector('.web-link-arrow')).toBeNull();
  });

  it('dispatches through the SECTION_REGISTRY (SectionBlock renders the shared component)', () => {
    const { container } = render(
      <SectionBlock section={blogSection()} locale="ar" mode="preview" />,
    );
    expect(container.querySelector('.web-log-section')).toBeInTheDocument();
    expect(container.querySelectorAll('.web-log-row')).toHaveLength(2);
  });

  it('wraps each row in a record-edit affordance in the studio (mode=edit) → deep-links to the post', () => {
    const onEditRecord = vi.fn();
    const sec = section({
      type: 'blog',
      collection: {
        collection: 'blog',
        items: [blogPostItem({ id: 'b-1', slug: 'post-one' })],
      },
    });
    const { container } = render(
      <EditProvider
        value={{
          locale: 'en',
          onCommit: vi.fn(),
          onEditRecord,
          editRecordLabel: 'Edit record',
        }}
      >
        <BlogSection section={sec} locale="en" mode="edit" />
      </EditProvider>,
    );
    const btn = container.querySelector('.web-record-edit-btn');
    expect(btn).not.toBeNull();
    fireEvent.click(btn as HTMLElement);
    expect(onEditRecord).toHaveBeenCalledWith('blog', 'b-1');
  });
});
