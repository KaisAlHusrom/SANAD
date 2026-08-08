import { describe, expect, it } from 'vitest';
import { SEED_PAGES } from './seed-data.js';

/**
 * Guards the Phase-5 hybrid marketing pages (U9/WEB1) — each is seeded as two generic `richtext`
 * bands (an editable hero + a closing CTA) around a website-rendered body; the hero's primary CTA
 * targets the right conversion route. Content correctness (getTree hydration of pure `richtext`
 * bands) is already exercised by the privacy/terms/about int-spec cases + the runtime boot check.
 */
describe('SEED_PAGES — Phase-5 hybrid marketing pages', () => {
  const bySlug = (slug: string) => SEED_PAGES.find((p) => p.slug === slug);

  it.each([
    ['process', '/request-a-project'],
    ['portfolio', '/request-a-project'],
    ['services', '/contact'],
    ['blog', '/request-a-project'],
  ])(
    '%s: two richtext bands, hero CTA → %s, bilingual meta',
    (slug, ctaHref) => {
      const page = bySlug(slug);
      expect(page).toBeDefined();
      if (!page) return;

      // exactly the editable hero + closing-CTA bands (the body is a website component, not seeded)
      expect(page.sections.map((s) => s.type)).toEqual([
        'richtext',
        'richtext',
      ]);

      // the hero band carries a head + a primary CTA button to the conversion route
      const [hero, closing] = page.sections;
      expect(hero).toBeDefined();
      expect(closing).toBeDefined();
      if (!hero || !closing) return;
      expect(hero.title?.ar).toBeTruthy();
      expect(hero.title?.en).toBeTruthy();
      expect(hero.blocks).toHaveLength(1);
      expect(hero.blocks[0]).toMatchObject({
        type: 'cta',
        data: { href: ctaHref, variant: 'primary' },
      });

      // the closing band is also a richtext + CTA band
      expect(closing.blocks[0]).toMatchObject({
        type: 'cta',
        data: { variant: 'primary' },
      });

      // SEO metadata is authored in both locales
      expect(page.metaTitle?.ar).toBeTruthy();
      expect(page.metaTitle?.en).toBeTruthy();
      expect(page.metaDescription?.ar).toBeTruthy();
      expect(page.metaDescription?.en).toBeTruthy();
    },
  );
});

/**
 * Guards the final Phase-5 marketing pages (careers + the two lead-form pages). Careers is a FULL
 * CMS page (about-style) — four editable `richtext` bands (hero + culture + openings + closing CTA);
 * its coded card-grid body was retired for full studio editability. Contact + request-a-project are
 * CMS-chrome pages — a single editable `richtext` hero above the KEPT bespoke lead form (the form is
 * the conversion, so no CTA block + no closing band).
 */
describe('SEED_PAGES — Phase-5 final marketing pages', () => {
  const bySlug = (slug: string) => SEED_PAGES.find((p) => p.slug === slug);

  it('careers: four richtext bands, hero + closing CTA → /contact, bilingual meta', () => {
    const page = bySlug('careers');
    expect(page).toBeDefined();
    if (!page) return;

    // full CMS page: hero + culture + openings + closing CTA — all editable richtext
    expect(page.sections.map((s) => s.type)).toEqual([
      'richtext',
      'richtext',
      'richtext',
      'richtext',
    ]);

    const hero = page.sections[0];
    const closing = page.sections[page.sections.length - 1];
    expect(hero?.title?.ar).toBeTruthy();
    expect(hero?.title?.en).toBeTruthy();
    // careers has no lead form, so both the hero and the closing band route to /contact
    expect(hero?.blocks[0]).toMatchObject({
      type: 'cta',
      data: { href: '/contact', variant: 'primary' },
    });
    expect(closing?.blocks[0]).toMatchObject({
      type: 'cta',
      data: { href: '/contact', variant: 'primary' },
    });

    expect(page.metaTitle?.ar).toBeTruthy();
    expect(page.metaTitle?.en).toBeTruthy();
    expect(page.metaDescription?.ar).toBeTruthy();
    expect(page.metaDescription?.en).toBeTruthy();
  });

  it.each([['contact'], ['request-a-project']])(
    '%s: a single editable richtext hero band (no CTA — the form is the conversion), bilingual meta',
    (slug) => {
      const page = bySlug(slug);
      expect(page).toBeDefined();
      if (!page) return;

      // CMS chrome only: one hero band above the kept bespoke form
      expect(page.sections.map((s) => s.type)).toEqual(['richtext']);

      const hero = page.sections[0];
      expect(hero?.title?.ar).toBeTruthy();
      expect(hero?.title?.en).toBeTruthy();
      expect(hero?.subtitle?.ar).toBeTruthy();
      expect(hero?.subtitle?.en).toBeTruthy();
      // no CTA block — the lead form is the call to action
      expect(hero?.blocks ?? []).toHaveLength(0);

      expect(page.metaTitle?.ar).toBeTruthy();
      expect(page.metaTitle?.en).toBeTruthy();
      expect(page.metaDescription?.ar).toBeTruthy();
      expect(page.metaDescription?.en).toBeTruthy();
    },
  );
});
