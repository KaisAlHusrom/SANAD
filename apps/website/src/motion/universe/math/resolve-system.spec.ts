import { describe, expect, it } from 'vitest';
import { resolveSystem } from './resolve-system';

describe('resolveSystem (pathname → star system)', () => {
  it('maps the locale root to the landing solar system', () => {
    expect(resolveSystem('/ar')).toEqual({ system: 'landing', slug: null });
    expect(resolveSystem('/en')).toEqual({ system: 'landing', slug: null });
    expect(resolveSystem('/ar/')).toEqual({ system: 'landing', slug: null });
    expect(resolveSystem('/')).toEqual({ system: 'landing', slug: null });
  });

  it('maps the services index to the services system', () => {
    expect(resolveSystem('/ar/services')).toEqual({
      system: 'services',
      slug: null,
    });
    expect(resolveSystem('/en/services/')).toEqual({
      system: 'services',
      slug: null,
    });
  });

  it('maps a service detail to its close-orbit system, capturing the slug', () => {
    expect(resolveSystem('/ar/services/web-development')).toEqual({
      system: 'serviceDetail',
      slug: 'web-development',
    });
    expect(resolveSystem('/en/services/erp')).toEqual({
      system: 'serviceDetail',
      slug: 'erp',
    });
  });

  it('decodes an encoded (Arabic) slug so it matches the route param', () => {
    expect(
      resolveSystem('/ar/services/%D8%AA%D8%B7%D9%88%D9%8A%D8%B1'),
    ).toEqual({
      system: 'serviceDetail',
      slug: 'تطوير',
    });
  });

  it('maps the portfolio index to the works "Galaxy" system', () => {
    expect(resolveSystem('/ar/portfolio')).toEqual({
      system: 'works',
      slug: null,
    });
    expect(resolveSystem('/en/portfolio/')).toEqual({
      system: 'works',
      slug: null,
    });
  });

  it('maps a case-study detail to the SAME works system, capturing the slug (intra-system hop)', () => {
    expect(resolveSystem('/ar/portfolio/raseed')).toEqual({
      system: 'works',
      slug: 'raseed',
    });
    expect(resolveSystem('/en/portfolio/riaya')).toEqual({
      system: 'works',
      slug: 'riaya',
    });
    // deeper-than-detail portfolio paths are the CMS catch-all, not a case study
    expect(resolveSystem('/ar/portfolio/a/b')).toEqual({
      system: 'ambient',
      slug: null,
    });
  });

  it('maps contact to the beacon system', () => {
    expect(resolveSystem('/ar/contact')).toEqual({
      system: 'contact',
      slug: null,
    });
  });

  it('maps about to the Hearth system', () => {
    expect(resolveSystem('/ar/about')).toEqual({ system: 'about', slug: null });
    expect(resolveSystem('/en/about/')).toEqual({
      system: 'about',
      slug: null,
    });
    // nested about paths are not the about page
    expect(resolveSystem('/ar/about/team')).toEqual({
      system: 'ambient',
      slug: null,
    });
  });

  it('maps process to the Waypoints system', () => {
    expect(resolveSystem('/ar/process')).toEqual({
      system: 'process',
      slug: null,
    });
    expect(resolveSystem('/en/process/')).toEqual({
      system: 'process',
      slug: null,
    });
    // nested process paths are not the process page
    expect(resolveSystem('/ar/process/discovery')).toEqual({
      system: 'ambient',
      slug: null,
    });
  });

  it('maps the blog index to the Logbook system', () => {
    expect(resolveSystem('/ar/blog')).toEqual({ system: 'blog', slug: null });
    expect(resolveSystem('/en/blog/')).toEqual({ system: 'blog', slug: null });
  });

  it('maps a post detail to the SAME blog system, capturing the slug (intra-system hop)', () => {
    expect(resolveSystem('/ar/blog/weekly-owner-meetings')).toEqual({
      system: 'blog',
      slug: 'weekly-owner-meetings',
    });
    expect(resolveSystem('/en/blog/we-stay-after-launch')).toEqual({
      system: 'blog',
      slug: 'we-stay-after-launch',
    });
    // deeper-than-detail blog paths are the CMS catch-all, not a post
    expect(resolveSystem('/ar/blog/a/b')).toEqual({
      system: 'ambient',
      slug: null,
    });
  });

  it('maps request-a-project to its OWN "Launchpad" system (the flagship conversion surface)', () => {
    expect(resolveSystem('/ar/request-a-project')).toEqual({
      system: 'request',
      slug: null,
    });
    expect(resolveSystem('/en/request-a-project/')).toEqual({
      system: 'request',
      slug: null,
    });
    // nested request paths are not the request page
    expect(resolveSystem('/ar/request-a-project/thanks')).toEqual({
      system: 'ambient',
      slug: null,
    });
  });

  it('maps FAQ + Careers into the SAME contact "Beacon" system (the reach-out cluster)', () => {
    expect(resolveSystem('/ar/faq')).toEqual({ system: 'contact', slug: null });
    expect(resolveSystem('/en/faq/')).toEqual({
      system: 'contact',
      slug: null,
    });
    expect(resolveSystem('/ar/careers')).toEqual({
      system: 'contact',
      slug: null,
    });
    expect(resolveSystem('/en/careers/')).toEqual({
      system: 'contact',
      slug: null,
    });
    // nested paths are not the page
    expect(resolveSystem('/ar/faq/a')).toEqual({
      system: 'ambient',
      slug: null,
    });
    expect(resolveSystem('/ar/careers/a')).toEqual({
      system: 'ambient',
      slug: null,
    });
  });

  it('maps CMS catch-all / unknown routes to the ambient deep-space fallback', () => {
    expect(resolveSystem('/ar/privacy')).toEqual({
      system: 'ambient',
      slug: null,
    });
    expect(resolveSystem('/en/legal/terms')).toEqual({
      system: 'ambient',
      slug: null,
    });
    // deeper-than-detail service paths are the CMS catch-all, not a detail orbit
    expect(resolveSystem('/ar/services/a/b')).toEqual({
      system: 'ambient',
      slug: null,
    });
    // nested contact paths are not the contact page
    expect(resolveSystem('/ar/contact/thanks')).toEqual({
      system: 'ambient',
      slug: null,
    });
  });

  it('tolerates a missing locale prefix (middleware normally adds it)', () => {
    expect(resolveSystem('/services')).toEqual({
      system: 'services',
      slug: null,
    });
    expect(resolveSystem('/services/erp')).toEqual({
      system: 'serviceDetail',
      slug: 'erp',
    });
  });

  it('never throws on a malformed encoded segment', () => {
    expect(resolveSystem('/ar/services/%E0%A4%A')).toEqual({
      system: 'serviceDetail',
      slug: '%E0%A4%A',
    });
  });
});
