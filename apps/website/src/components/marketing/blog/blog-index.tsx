'use client';

import {
  pickLocalized,
  type BlogCategoryItem,
  type BlogPostItem,
  type Locale,
} from '@sanad/contracts';
import { TravelLink } from '../../../motion/universe';
import { RevealOnScroll } from '../reveal-on-scroll';
import { copy } from '../services/services-copy';
import { BLOG_COPY, POST_COPY } from './blog-copy';
import { logStamp } from './blog-format';
import { ALL_CATEGORY, useBlogFilter } from './use-blog-filter';

/**
 * The Blog index BODY (`/blog`, Phase-5 hybrid) — 100% DB-driven (WEB1/WEB2): the published CMS
 * `blog_post` entities feed the article grid + a no-reload category filter (U5 hook). The page's
 * editable hero + closing-CTA bands are seeded `richtext` CMS sections rendered around this body by
 * the route (`FALLBACK_BLOG_SECTIONS` / `getPage('blog')`). Reuses the landing `.lp-*` primitives +
 * the `.mk-*` classes (F9); motion via `RevealOnScroll` (WEB3/WEB4); tokens + logical properties +
 * full RTL (U6/U7). The blog "Logbook" star system lights it in amber (P8.E-3).
 */
export function BlogIndex({
  posts,
  categories,
  locale,
}: {
  posts: BlogPostItem[];
  categories: BlogCategoryItem[];
  locale: Locale;
}) {
  const { active, setActive, visible } = useBlogFilter(posts);
  // only offer chips for categories that actually have published posts (never a dead filter)
  const chips = categories.filter((category) =>
    posts.some((post) => post.category?.slug === category.slug),
  );

  return (
    <div className="mk-page">
      {/* Article list + category filter */}
      <section id="articles" className="lp-section">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                {copy(BLOG_COPY.list.eyebrow, locale)}
              </p>
              <h2 className="lp-h2">{copy(BLOG_COPY.list.title, locale)}</h2>
            </div>
          </RevealOnScroll>

          {posts.length > 0 ? (
            <>
              {chips.length > 0 ? (
                <RevealOnScroll>
                  <div
                    className="mk-filter"
                    role="group"
                    aria-label={copy(BLOG_COPY.filter.label, locale)}
                  >
                    <button
                      type="button"
                      className="mk-filter-chip"
                      aria-pressed={active === ALL_CATEGORY}
                      onClick={() => setActive(ALL_CATEGORY)}
                    >
                      {copy(BLOG_COPY.filter.all, locale)}
                    </button>
                    {chips.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className="mk-filter-chip"
                        aria-pressed={active === category.slug}
                        onClick={() => setActive(category.slug)}
                      >
                        {pickLocalized(category.name, locale)}
                      </button>
                    ))}
                  </div>
                </RevealOnScroll>
              ) : null}

              <div className="mk-grid mk-grid--3">
                {visible.map((post, index) => (
                  <RevealOnScroll key={post.id} index={index} as="article">
                    <TravelLink
                      href={`/${locale}/blog/${post.slug}`}
                      className="lp-panel mk-log-card"
                    >
                      <span className="mk-log-card-head">
                        <span className="lp-micro lp-ltr mk-log-card-date">
                          {logStamp(post.publishedAt)}
                        </span>
                        {post.category ? (
                          <span className="lp-micro mk-log-card-cat">
                            {pickLocalized(post.category.name, locale)}
                          </span>
                        ) : null}
                      </span>
                      <h3 className="lp-card-title">
                        {pickLocalized(post.title, locale)}
                      </h3>
                      <p className="lp-card-body">
                        {pickLocalized(post.excerpt, locale)}
                      </p>
                      <span className="mk-log-card-foot">
                        {post.readMinutes ? (
                          <span className="lp-micro lp-ltr mk-log-card-read">
                            {post.readMinutes}{' '}
                            {copy(POST_COPY.readUnit, locale)}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="mk-service-more" aria-hidden="true">
                          {locale === 'ar'
                            ? 'اقرأ المقال ←'
                            : 'Read the article →'}
                        </span>
                      </span>
                    </TravelLink>
                  </RevealOnScroll>
                ))}
              </div>
            </>
          ) : (
            <p className="lp-empty">{copy(BLOG_COPY.list.empty, locale)}</p>
          )}
        </div>
      </section>
    </div>
  );
}
