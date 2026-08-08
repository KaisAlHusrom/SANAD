import { describe, expect, it } from 'vitest';
import { pickLocalized } from '@sanad/contracts';
import { ABOUT_COPY } from './about/about-copy';
import { FAQ_COPY } from './faq/faq-copy';
import { PROCESS_COPY } from './process/process-copy';
import { PORTFOLIO_COPY } from './portfolio/portfolio-copy';
import { SERVICES_COPY } from './services/services-copy';
import { BLOG_COPY } from './blog/blog-copy';
import { CAREERS_COPY } from './careers/careers-copy';
import { CONTACT_COPY } from './contact/contact-copy';
import { REQUEST_COPY } from './request/request-copy';
import {
  FALLBACK_ABOUT_SECTIONS,
  FALLBACK_BLOG_SECTIONS,
  FALLBACK_CAREERS_SECTIONS,
  FALLBACK_CONTACT_SECTIONS,
  FALLBACK_FAQ_SECTIONS,
  FALLBACK_PORTFOLIO_SECTIONS,
  FALLBACK_PROCESS_SECTIONS,
  FALLBACK_REQUEST_SECTIONS,
  FALLBACK_SERVICES_SECTIONS,
} from './marketing-fallback-sections';

describe('marketing fallback sections (F3/F7)', () => {
  it('About: richtext hero+story+values, a team roster, a richtext closing CTA — from the copy', () => {
    expect(FALLBACK_ABOUT_SECTIONS.map((s) => s.type)).toEqual([
      'richtext',
      'richtext',
      'richtext',
      'team',
      'richtext',
    ]);
    const hero = FALLBACK_ABOUT_SECTIONS[0];
    expect(pickLocalized(hero.title, 'en')).toBe(ABOUT_COPY.hero.title.en);
    // the hero CTA button is a locale-agnostic root-relative link (localized at render)
    expect(hero.blocks[0]).toMatchObject({
      type: 'cta',
      data: { href: '/contact' },
    });
    // the story prose is assembled HTML from the copy (both paragraphs present)
    const story = FALLBACK_ABOUT_SECTIONS[1];
    expect(pickLocalized(story.blocks[0].body, 'en')).toContain(
      ABOUT_COPY.story.body1.en,
    );
    expect(pickLocalized(story.blocks[0].body, 'en')).toContain(
      ABOUT_COPY.story.body2.en,
    );
    // no fallback links a collection (a down backend shows chrome without live records)
    expect(FALLBACK_ABOUT_SECTIONS.every((s) => s.collection === null)).toBe(
      true,
    );
  });

  it('FAQ: richtext hero, a faq accordion, a richtext closing CTA — from the copy', () => {
    expect(FALLBACK_FAQ_SECTIONS.map((s) => s.type)).toEqual([
      'richtext',
      'faq',
      'richtext',
    ]);
    expect(pickLocalized(FALLBACK_FAQ_SECTIONS[1].title, 'ar')).toBe(
      FAQ_COPY.list.title.ar,
    );
    expect(FALLBACK_FAQ_SECTIONS.every((s) => s.collection === null)).toBe(
      true,
    );
  });

  // The Phase-5 hybrid pages: only the two editable bands (the body is a website component).
  it.each([
    ['process', FALLBACK_PROCESS_SECTIONS, PROCESS_COPY, '/request-a-project'],
    [
      'portfolio',
      FALLBACK_PORTFOLIO_SECTIONS,
      PORTFOLIO_COPY,
      '/request-a-project',
    ],
    ['services', FALLBACK_SERVICES_SECTIONS, SERVICES_COPY, '/contact'],
    ['blog', FALLBACK_BLOG_SECTIONS, BLOG_COPY, '/request-a-project'],
  ] as const)(
    '%s (hybrid): a richtext hero + a richtext closing CTA, from the copy',
    (_slug, sections, copy, ctaHref) => {
      expect(sections.map((s) => s.type)).toEqual(['richtext', 'richtext']);
      const [hero, closing] = sections;
      expect(pickLocalized(hero.title, 'en')).toBe(copy.hero.title.en);
      expect(hero.blocks[0]).toMatchObject({
        type: 'cta',
        data: { href: ctaHref },
      });
      expect(pickLocalized(closing.title, 'ar')).toBe(copy.cta.title.ar);
      // no fallback links a collection (a down backend shows chrome without live records)
      expect(sections.every((s) => s.collection === null)).toBe(true);
    },
  );

  it('Careers (full CMS): richtext hero + culture + openings + closing CTA, from the copy', () => {
    expect(FALLBACK_CAREERS_SECTIONS.map((s) => s.type)).toEqual([
      'richtext',
      'richtext',
      'richtext',
      'richtext',
    ]);
    const [hero, culture, , closing] = FALLBACK_CAREERS_SECTIONS;
    expect(pickLocalized(hero.title, 'en')).toBe(CAREERS_COPY.hero.title.en);
    // careers has no lead form → hero + closing both route to /contact
    expect(hero.blocks[0]).toMatchObject({
      type: 'cta',
      data: { href: '/contact' },
    });
    expect(closing.blocks[0]).toMatchObject({
      type: 'cta',
      data: { href: '/contact' },
    });
    // culture cards are prose (h3 + p per item), the editable trade for the retired card grid
    expect(pickLocalized(culture.blocks[0].body, 'en')).toContain(
      CAREERS_COPY.culture.items[0].title.en,
    );
    expect(pickLocalized(culture.blocks[0].body, 'en')).toContain(
      CAREERS_COPY.culture.items[0].desc.en,
    );
    expect(FALLBACK_CAREERS_SECTIONS.every((s) => s.collection === null)).toBe(
      true,
    );
  });

  // The two lead-form pages: a single editable richtext hero band, no CTA block (the form is the CTA).
  it.each([
    ['contact', FALLBACK_CONTACT_SECTIONS, CONTACT_COPY],
    ['request-a-project', FALLBACK_REQUEST_SECTIONS, REQUEST_COPY],
  ] as const)(
    '%s (chrome): a single richtext hero, no CTA block, from the copy',
    (_slug, sections, copy) => {
      expect(sections.map((s) => s.type)).toEqual(['richtext']);
      const [hero] = sections;
      expect(pickLocalized(hero.title, 'en')).toBe(copy.hero.title.en);
      expect(pickLocalized(hero.subtitle, 'ar')).toBe(copy.hero.subtitle.ar);
      expect(hero.blocks).toHaveLength(0);
      expect(sections.every((s) => s.collection === null)).toBe(true);
    },
  );
});
