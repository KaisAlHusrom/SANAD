import { pickLocalized } from '@sanad/contracts';
import { RecordEditFrame } from '../../editable/record-edit-frame.js';
import type { SectionComponentProps } from '../section-component.types.js';
import { SectionField } from '../section-field.js';
import { resolveSlots } from '../section-slots.js';
import { BLOG_COPY } from './blog-copy.js';
import { BlogRow } from './blog-row.js';
import type { BlogAllLink, BlogRowLink } from './blog-row.types.js';
import { deriveBlogRows } from './derive-blog-posts.js';

export interface BlogSectionProps extends SectionComponentProps {
  /** Per-row article link — the website injects its comet-flight `TravelLink`; admin uses `<a>`. */
  RowLink?: BlogRowLink;
  /** The "all articles →" header link — the website injects its `TravelLink` to `/blog`. */
  AllLink?: BlogAllLink;
}

/** The default "all articles" link — a plain `<a href="/blog">` (the admin preview). */
function DefaultAllLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a className={className} href="/blog">
      {children}
    </a>
  );
}

/**
 * The `blog` ship's-log teaser (WEB1) — the shared per-type component both the website
 * (`mode='live'`, with its `.lp-flow` `Reveal` + comet-flight links) and the admin Content Studio
 * (`mode='preview'|'edit'`) render (preview === live). A head (eyebrow/title — section-owned copy,
 * inline-editable in `edit`) with an "all articles →" link, over the latest posts as log rows from
 * the section's HYDRATED `blog` collection (curated in the Blog module via the admin config panel).
 * Unlike works/trust, blog NEVER returns null — it shows an explicit empty state (F3) so the chapter
 * is always present. Tokens-only `.web-*`, logical properties (RTL, U6/U7).
 */
export function BlogSection({
  section,
  locale,
  mode,
  slots,
  resolveImageUrl,
  RowLink,
  AllLink,
}: BlogSectionProps) {
  const { Reveal } = resolveSlots(slots);
  // resolve covers HERE (server-side) so rows carry a plain `coverUrl` — never a function crosses
  const rows = deriveBlogRows(section, locale, resolveImageUrl);
  const All = AllLink ?? DefaultAllLink;
  const arrow = locale === 'ar' ? '←' : '→';

  return (
    <section className="web-log-section" data-section-type="blog">
      <Reveal className="web-log-head">
        <div className="web-log-head-copy">
          <SectionField
            as="p"
            className="web-log-eyebrow"
            value={pickLocalized(section.eyebrow, locale)}
            fallback={pickLocalized(BLOG_COPY.eyebrow, locale)}
            mode={mode}
            path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
          />
          <SectionField
            as="h2"
            className="web-log-h2"
            value={pickLocalized(section.title, locale)}
            fallback={pickLocalized(BLOG_COPY.title, locale)}
            mode={mode}
            path={{ kind: 'section', sectionId: section.id, field: 'title' }}
          />
        </div>
        {rows.length > 0 ? (
          <All className="web-link-arrow">
            {pickLocalized(BLOG_COPY.all, locale)} ←
          </All>
        ) : null}
      </Reveal>

      {rows.length === 0 ? (
        <Reveal>
          <p className="web-empty">{pickLocalized(BLOG_COPY.empty, locale)}</p>
        </Reveal>
      ) : (
        <Reveal>
          <div className="web-log">
            {rows.map((row) =>
              mode === 'edit' ? (
                <RecordEditFrame key={row.id} collection="blog" id={row.id}>
                  <BlogRow row={row} arrow={arrow} RowLink={RowLink} />
                </RecordEditFrame>
              ) : (
                <BlogRow
                  key={row.id}
                  row={row}
                  arrow={arrow}
                  RowLink={RowLink}
                />
              ),
            )}
          </div>
        </Reveal>
      )}
    </section>
  );
}
