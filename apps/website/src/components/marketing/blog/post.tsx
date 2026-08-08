import {
  pickLocalized,
  type BlogPostItem,
  type Locale,
} from '@sanad/contracts';
import { TravelLink } from '../../../motion/universe';
import { RevealOnScroll } from '../reveal-on-scroll';
import { copy } from '../services/services-copy';
import { POST_COPY } from './blog-copy';
import { logStamp } from './blog-format';

/** Split the localized body into prose paragraphs on blank lines (kept pure/SSR-stable). */
function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * A blog post detail page (`/blog/[slug]`) — the CMS `blog_post` supplies title/excerpt/body +
 * category/author/tags/date/read-time (WEB1); the branded chrome (breadcrumb, meta labels, tags,
 * related, CTA) is coded-default (U9). Split hero with the optional cover on the inline-start; the
 * prose body is the substance (a single localized string rendered as paragraphs). With no cover
 * the blog "Logbook" planet behind the page IS the visual (P8.E-3). Derived from the case-study
 * pattern (F9); tokens + logical properties + full RTL (U6/U7).
 */
export function Post({
  post,
  related,
  coverUrl,
  locale,
}: {
  post: BlogPostItem;
  related: BlogPostItem[];
  coverUrl: string;
  locale: Locale;
}) {
  const requestHref = `/${locale}/request-a-project`;
  const body = paragraphs(pickLocalized(post.body, locale));
  const stamp = logStamp(post.publishedAt);

  return (
    <article className="mk-page mk-detail mk-post">
      {/* Breadcrumb split hero */}
      <section className="lp-section mk-detail-hero">
        <div className="lp-shell">
          <RevealOnScroll trigger="mount">
            <nav className="mk-breadcrumb lp-eyebrow" aria-label="breadcrumb">
              <TravelLink
                href={`/${locale}/blog`}
                className="mk-breadcrumb-link"
              >
                {copy(POST_COPY.home, locale)}
              </TravelLink>
              <span aria-hidden="true"> · </span>
              <span className="lp-ltr">{post.slug.toUpperCase()}</span>
            </nav>
          </RevealOnScroll>
          <div className="mk-detail-hero-grid">
            <div className="mk-detail-hero-copy">
              {post.category ? (
                <RevealOnScroll trigger="mount" index={1}>
                  <p className="lp-eyebrow mk-post-cat">
                    {pickLocalized(post.category.name, locale)}
                  </p>
                </RevealOnScroll>
              ) : null}
              <RevealOnScroll trigger="mount" index={1}>
                <h1 className="mk-hero-title">
                  {pickLocalized(post.title, locale)}
                </h1>
              </RevealOnScroll>
              <RevealOnScroll trigger="mount" index={2}>
                <p className="mk-hero-lead">
                  {pickLocalized(post.excerpt, locale)}
                </p>
              </RevealOnScroll>
              <RevealOnScroll trigger="mount" index={3}>
                <div className="mk-post-byline">
                  {post.author ? (
                    <span className="mk-post-byline-author">
                      {pickLocalized(post.author.name, locale)}
                    </span>
                  ) : null}
                  {stamp ? (
                    <span className="lp-micro lp-ltr">{stamp}</span>
                  ) : null}
                  {post.readMinutes ? (
                    <span className="lp-micro lp-ltr">
                      {post.readMinutes} {copy(POST_COPY.readUnit, locale)}
                    </span>
                  ) : null}
                </div>
              </RevealOnScroll>
            </div>
            {/* the cover renders ONLY when an image exists — with none, the Logbook planet behind
                the page (the blog star system, P8.E-3) IS the visual */}
            {coverUrl ? (
              <RevealOnScroll trigger="mount" index={2}>
                <div className="mk-detail-cover">
                  <img
                    className="mk-detail-cover-img"
                    src={coverUrl}
                    alt={pickLocalized(post.title, locale)}
                  />
                </div>
              </RevealOnScroll>
            ) : null}
          </div>
        </div>
      </section>

      {/* Prose body */}
      <section className="lp-section mk-post-body-section">
        <div className="lp-shell">
          <div className="mk-post-body">
            {body.map((para, index) => (
              <RevealOnScroll key={index} index={index} as="p">
                {para}
              </RevealOnScroll>
            ))}
          </div>

          {post.tags.length > 0 ? (
            <RevealOnScroll>
              <div className="mk-post-tags">
                <span className="lp-micro mk-post-tags-label">
                  {copy(POST_COPY.tags, locale)}
                </span>
                {post.tags.map((tag) => (
                  <span key={tag.id} className="mk-post-tag">
                    {pickLocalized(tag.name, locale)}
                  </span>
                ))}
              </div>
            </RevealOnScroll>
          ) : null}
        </div>
      </section>

      {/* Related writing */}
      {related.length > 0 ? (
        <section className="lp-section">
          <div className="lp-shell">
            <RevealOnScroll>
              <div className="lp-section-head">
                <p className="lp-eyebrow">
                  {copy(POST_COPY.related.eyebrow, locale)}
                </p>
                <h2 className="lp-h2">
                  {copy(POST_COPY.related.title, locale)}
                </h2>
              </div>
            </RevealOnScroll>
            <div className="mk-grid mk-grid--3">
              {related.map((item, index) => (
                <RevealOnScroll key={item.id} index={index} as="article">
                  <TravelLink
                    href={`/${locale}/blog/${item.slug}`}
                    className="lp-panel mk-log-card"
                  >
                    <span className="mk-log-card-head">
                      <span className="lp-micro lp-ltr mk-log-card-date">
                        {logStamp(item.publishedAt)}
                      </span>
                      {item.category ? (
                        <span className="lp-micro mk-log-card-cat">
                          {pickLocalized(item.category.name, locale)}
                        </span>
                      ) : null}
                    </span>
                    <h3 className="lp-card-title">
                      {pickLocalized(item.title, locale)}
                    </h3>
                    <p className="lp-card-body">
                      {pickLocalized(item.excerpt, locale)}
                    </p>
                    <span className="mk-service-more" aria-hidden="true">
                      {locale === 'ar' ? 'اقرأ المقال ←' : 'Read the article →'}
                    </span>
                  </TravelLink>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="lp-section mk-cta">
        <div className="lp-shell">
          <RevealOnScroll>
            <div className="mk-cta-panel">
              <h2 className="lp-h2 lp-h2--center">
                {copy(POST_COPY.cta.title, locale)}
              </h2>
              <p className="lp-section-lead lp-section-lead--center">
                {copy(POST_COPY.cta.subtitle, locale)}
              </p>
              <div className="mk-cta-actions">
                <TravelLink
                  className="lp-cta lp-cta--primary"
                  href={requestHref}
                >
                  {copy(POST_COPY.cta.talk, locale)}
                </TravelLink>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </article>
  );
}
