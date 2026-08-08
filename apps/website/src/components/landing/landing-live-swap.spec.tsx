import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { SectionNode } from '@sanad/contracts';
import {
  BlogSection,
  CtaSection,
  HeroSection,
  ProcessSection,
  ServicesSection,
  StatsSection,
  TestimonialsSection,
  TrustSection,
  WebsiteShell,
  WorksSection,
} from '@sanad/web-ui';
import {
  blogAllLink,
  blogLiveSlots,
  blogRowLink,
  ctaLiveSlots,
  heroLiveSlots,
  processLiveSlots,
  servicesLiveSlots,
  statsLiveSlots,
  testimonialsLiveSlots,
  trustLiveSlots,
  worksLiveSlots,
} from './live-section-slots';
import {
  FALLBACK_BLOG_SECTION,
  FALLBACK_CTA_SECTION,
  FALLBACK_HERO_SECTION,
  FALLBACK_SERVICES_SECTION,
  FALLBACK_TESTIMONIALS_SECTION,
  FALLBACK_TRUST_SECTION,
  FALLBACK_WORK_SECTION,
} from './fallback-sections';
import { ProcessMoons } from './process';
import { TrustConstellation } from './trust';
import { WorksOrbit } from './works-orbit';
import { findSection } from './section-content';

// GSAP/Lenis aren't exercised here — this asserts the shared component + injected-slot wiring the
// landing route uses (the P8.5 live-swap: preview===live), not the scroll choreography.
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn() } }));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create: () => ({ kill: vi.fn() }) },
}));

function loc(ar: string, en = ar) {
  return { ar, en };
}

function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce') ? reduce : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  setReducedMotion(false);
});

/** The exact composition `app/[locale]/page.tsx` renders for the swapped hero. */
function renderHero(section: SectionNode, locale: 'ar' | 'en' = 'ar') {
  return render(
    <WebsiteShell locale={locale}>
      <HeroSection
        section={section}
        locale={locale}
        mode="live"
        anchorId="hero"
        slots={heroLiveSlots(locale)}
      />
    </WebsiteShell>,
  );
}

describe('landing live-swap — hero (shared @sanad/web-ui component)', () => {
  const hero: SectionNode = {
    id: 'hero',
    type: 'hero',
    sortOrder: 0,
    published: true,
    eyebrow: loc('سَند التقنية'),
    title: loc('نَبني نظامك'),
    subtitle: loc('نحوّل فكرتك إلى منتجٍ حي'),
    blocks: [],
    config: null,
    collection: null,
  };

  it('keeps the cosmos docking id + word-split headline', () => {
    const { container } = renderHero(hero, 'ar');
    // #hero drives the planet-dock (use-section-metrics), the wayfinder + the anchor glide
    expect(container.querySelector('section.web-hero')?.id).toBe('hero');
    expect(
      screen.getByRole('heading', { level: 1 }).getAttribute('aria-label'),
    ).toContain('نَبني نظامك');
    expect(screen.getByText('نحوّل فكرتك إلى منتجٍ حي')).toBeInTheDocument();
  });

  it('injects the warp CTA (→ request-a-project) + the #works anchor glide, plus the veil + cue', () => {
    const { container } = renderHero(hero, 'ar');
    const primary = screen.getByText('ابدأ مشروعك').closest('a');
    expect(primary).toHaveAttribute('href', '/ar/request-a-project');
    const secondary = screen.getByText('شاهد أعمالنا').closest('a');
    expect(secondary).toHaveAttribute('href', '#works');
    // cosmos chrome injected via the Backdrop + Cue slots
    expect(container.querySelector('.web-hero-veil')).toBeInTheDocument();
    expect(container.querySelector('.web-hero-cue')).toBeInTheDocument();
  });

  it('localizes the warp CTA href per locale (en)', () => {
    renderHero(FALLBACK_HERO_SECTION, 'en');
    expect(screen.getByText('Start your project').closest('a')).toHaveAttribute(
      'href',
      '/en/request-a-project',
    );
  });

  it('renders coded-default copy + proof strip when the page failed to load (F3/F7)', () => {
    // findSection(null,'hero') → undefined → FALLBACK_HERO_SECTION, so the page is never blank
    const section = findSection(null, 'hero') ?? FALLBACK_HERO_SECTION;
    const { container } = renderHero(section, 'en');
    expect(
      screen.getByRole('heading', { level: 1 }).getAttribute('aria-label'),
    ).toContain('We build your system');
    expect(container.querySelectorAll('.web-hero-proof-item').length).toBe(3);
  });
});

describe('landing live-swap — stats (shared @sanad/web-ui component)', () => {
  const stats: SectionNode = {
    id: 'stats',
    type: 'stats',
    sortOrder: 0,
    published: true,
    eyebrow: loc('٠٥ · بالأرقام'),
    title: loc('أرقامٌ تختصر الرحلة'),
    subtitle: loc(''),
    blocks: [
      {
        id: 's1',
        type: 'stat',
        sortOrder: 0,
        data: { value: 120, suffix: '+' },
        imageMediaId: null,
        title: loc('مشروع مُسلَّم'),
        body: loc('منذ ٢٠١٨'),
      },
    ],
    config: null,
    collection: null,
  };

  it('injects the .lp-flow reveal markers (the ChapterStage GSAP driver) + count-up', () => {
    setReducedMotion(true); // count-up resolves to the final value immediately (WEB4)
    const { container } = render(
      <WebsiteShell locale="ar">
        <StatsSection
          section={stats}
          locale="ar"
          mode="live"
          slots={statsLiveSlots}
        />
      </WebsiteShell>,
    );
    // the injected website Reveal emits `.lp-flow` so ChapterStage's querySelectorAll finds + arcs
    // the head + each stat (zero `.lp-flow` → the chapter reveal returns early)
    expect(container.querySelectorAll('.lp-flow').length).toBeGreaterThan(0);
    expect(screen.getByText('أرقامٌ تختصر الرحلة')).toBeInTheDocument();
    expect(screen.getByText('مشروع مُسلَّم')).toBeInTheDocument();
    expect(screen.getByText('120+')).toBeInTheDocument();
    expect(screen.getByText('منذ ٢٠١٨')).toBeInTheDocument();
  });
});

describe('landing live-swap — cta (shared @sanad/web-ui component)', () => {
  const cta: SectionNode = {
    id: 'cta',
    type: 'cta',
    sortOrder: 0,
    published: true,
    eyebrow: loc(''),
    title: loc(''),
    subtitle: loc(''),
    blocks: [
      {
        id: 'c1',
        type: 'feature',
        sortOrder: 0,
        data: {},
        imageMediaId: null,
        title: loc('خطوة أولى'),
        body: loc(''),
      },
    ],
    config: null,
    collection: null,
  };

  it('injects the warp CTA (→ request-a-project) + the #works ghost + the veil chrome + .lp-flow', () => {
    const { container } = render(
      <WebsiteShell locale="ar">
        <CtaSection
          section={cta}
          locale="ar"
          mode="live"
          slots={ctaLiveSlots('ar')}
        />
      </WebsiteShell>,
    );
    expect(container.querySelector('.web-cta-band')).toBeInTheDocument();
    expect(screen.getByText('ابدأ مشروعك').closest('a')).toHaveAttribute(
      'href',
      '/ar/request-a-project',
    );
    expect(screen.getByText('شاهد أعمالنا').closest('a')).toHaveAttribute(
      'href',
      '#works',
    );
    // the injected Backdrop chrome (`data-chapter-veil` so ChapterStage fades it with the content)
    expect(container.querySelector('.lp-cta-veil')).toBeInTheDocument();
    // Reveal emits `.lp-flow` for the ChapterStage reveal
    expect(container.querySelectorAll('.lp-flow').length).toBeGreaterThan(0);
    expect(screen.getByText('خطوة أولى')).toBeInTheDocument();
  });

  it('renders coded-default steps + localizes the warp CTA when the page failed to load (F3/F7)', () => {
    const section = findSection(null, 'cta') ?? FALLBACK_CTA_SECTION;
    const { container } = render(
      <WebsiteShell locale="en">
        <CtaSection
          section={section}
          locale="en"
          mode="live"
          slots={ctaLiveSlots('en')}
        />
      </WebsiteShell>,
    );
    expect(container.querySelectorAll('.web-cta-step').length).toBe(3);
    expect(screen.getByText('Start your project').closest('a')).toHaveAttribute(
      'href',
      '/en/request-a-project',
    );
  });
});

describe('landing live-swap — services (shared @sanad/web-ui component, Phase 3)', () => {
  const services: SectionNode = {
    id: 'services',
    type: 'services',
    sortOrder: 0,
    published: true,
    eyebrow: loc('٠٢ · الأنظمة'),
    title: loc('قدرةٌ كاملة'),
    subtitle: loc('فريقٌ واحد'),
    blocks: [
      {
        id: 'f1',
        type: 'feature',
        sortOrder: 0,
        data: { service: 'saas' },
        imageMediaId: null,
        title: loc('تقارير مخصّصة'),
        body: loc(''),
      },
    ],
    config: { mode: 'all', limit: 8, ids: [] },
    // the tree carries the section's cards HYDRATED in-service (Phase 3) — no `services` prop
    collection: {
      collection: 'services',
      items: [
        {
          id: 'svc1',
          slug: 'saas',
          iconKey: null,
          category: 'core',
          coverMediaId: null,
          sortOrder: 0,
          title: loc('منصّات سحابية'),
          summary: loc('منتجات متعددة المستأجرين'),
          detailBody: loc(''),
          createdAt: '',
          updatedAt: '',
        },
      ],
    },
  };

  it('renders the hydrated service cards + joined CMS caps + the .lp-flow reveal', () => {
    const { container } = render(
      <WebsiteShell locale="ar">
        <ServicesSection
          section={services}
          locale="ar"
          mode="live"
          slots={servicesLiveSlots}
        />
      </WebsiteShell>,
    );
    expect(container.querySelector('.web-services')).toBeInTheDocument();
    // the card comes from the hydrated collection (not a prop) + its SYS designation
    expect(screen.getByText('منصّات سحابية')).toBeInTheDocument();
    expect(screen.getByText('SYS·01 / SAAS')).toBeInTheDocument();
    // the joined CMS `feature` capability (data.service = saas)
    expect(screen.getByText('تقارير مخصّصة')).toBeInTheDocument();
    // Reveal emits `.lp-flow` for the ChapterStage reveal
    expect(container.querySelectorAll('.lp-flow').length).toBeGreaterThan(0);
  });

  it('renders nothing when the fallback section links no collection (F3)', () => {
    const { container } = render(
      <WebsiteShell locale="en">
        <ServicesSection
          section={FALLBACK_SERVICES_SECTION}
          locale="en"
          mode="live"
          slots={servicesLiveSlots}
        />
      </WebsiteShell>,
    );
    expect(container.querySelector('.web-services')).toBeNull();
  });
});

describe('landing live-swap — process (shared @sanad/web-ui component)', () => {
  const process: SectionNode = {
    id: 'process',
    type: 'process',
    sortOrder: 0,
    published: true,
    eyebrow: loc(''),
    title: loc(''),
    subtitle: loc(''),
    blocks: [
      {
        id: 'p1',
        type: 'step',
        sortOrder: 0,
        data: { duration: loc('أسبوع ١') },
        imageMediaId: null,
        title: loc('اكتشاف'),
        body: loc('نفهم فكرتك'),
      },
      {
        id: 'f1',
        type: 'feature',
        sortOrder: 5,
        data: { step: 1 },
        imageMediaId: null,
        title: loc('ملخّص'),
        body: loc(''),
      },
    ],
    config: null,
    collection: null,
  };

  it('injects the ProcessMoons System (the .web-process-* cards + orbital chrome) + the .lp-flow head', () => {
    const { container } = render(
      <WebsiteShell locale="ar">
        <ProcessSection
          section={process}
          locale="ar"
          mode="live"
          slots={processLiveSlots}
          System={ProcessMoons}
        />
      </WebsiteShell>,
    );
    // the injected live System renders the orbital chrome + the shared card DOM (preview===live)
    expect(container.querySelector('.web-process-system')).toBeInTheDocument();
    expect(container.querySelectorAll('.web-process-card').length).toBe(1);
    expect(screen.getByText('اكتشاف')).toBeInTheDocument();
    expect(screen.getByText('ملخّص')).toBeInTheDocument(); // the joined `feature` deliverable
    // the head Reveal emits `.lp-flow` so ChapterStage arcs the heading in
    expect(container.querySelectorAll('.lp-flow').length).toBeGreaterThan(0);
  });
});

describe('landing live-swap — trust (shared @sanad/web-ui component, Phase 3)', () => {
  function project(
    id: string,
    cat: { id: string; slug: string; name: { ar: string; en: string } },
  ) {
    return {
      id,
      slug: id,
      category: cat,
      coverMediaId: null,
      clientName: null,
      projectUrl: null,
      status: 'published' as const,
      publishedAt: '2026-01-01',
      featured: false,
      sortOrder: 0,
      title: loc('مشروع', 'Project'),
      summary: loc(''),
      challenge: loc(''),
      solution: loc(''),
      result: loc(''),
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
  }
  const fintech = {
    id: 'c-fin',
    slug: 'fintech',
    name: loc('تقنية مالية', 'Fintech'),
  };
  const logistics = {
    id: 'c-log',
    slug: 'logistics',
    name: loc('لوجستيات', 'Logistics'),
  };
  const trust: SectionNode = {
    id: 'trust',
    type: 'trust',
    sortOrder: 0,
    published: true,
    eyebrow: loc('٠١ · المجالات'),
    title: loc('الأنظمة التي تُشغّل أعمال المنطقة'),
    subtitle: loc('أنظمةٌ حيّة'),
    blocks: [],
    config: { mode: 'all', ids: [] },
    // the tree carries the section's portfolio records HYDRATED in-service (Phase 3) — no prop
    collection: {
      collection: 'portfolio',
      items: [
        project('a', fintech),
        project('b', fintech),
        project('c', logistics),
      ],
    },
  };

  it('renders the injected TrustConstellation (domains + live counts from the hydrated portfolio) + the .lp-flow head', () => {
    const { container } = render(
      <WebsiteShell locale="ar">
        <TrustSection
          section={trust}
          locale="ar"
          mode="live"
          slots={trustLiveSlots}
          Constellation={TrustConstellation}
        />
      </WebsiteShell>,
    );
    expect(container.querySelector('.web-trust')).toBeInTheDocument();
    // the animated constellation wrapper renders the SAME shared figure DOM (preview===live)
    expect(
      container.querySelector('.lp-trust-constellation-root'),
    ).toBeInTheDocument();
    // two distinct domains → two stars/labels, with mono live counts
    expect(container.querySelectorAll('[data-const-star]').length).toBe(2);
    const names = [...container.querySelectorAll('.web-const-name')].map(
      (n) => n.textContent,
    );
    expect(names).toEqual(['تقنية مالية', 'لوجستيات']);
    expect(
      [...container.querySelectorAll('.web-const-count')].map(
        (n) => n.textContent,
      ),
    ).toEqual(['× 02', '× 01']);
    // the head Reveal emits `.lp-flow` so ChapterStage arcs the heading in
    expect(container.querySelectorAll('.lp-flow').length).toBeGreaterThan(0);
  });

  it('renders nothing when the fallback section links no portfolio collection (F3)', () => {
    const { container } = render(
      <WebsiteShell locale="en">
        <TrustSection
          section={FALLBACK_TRUST_SECTION}
          locale="en"
          mode="live"
          slots={trustLiveSlots}
          Constellation={TrustConstellation}
        />
      </WebsiteShell>,
    );
    expect(container.querySelector('.web-trust')).toBeNull();
  });
});

describe('landing live-swap — work (shared @sanad/web-ui WEB10 orbit, Phase — works swap)', () => {
  function project(
    id: string,
    cover: string | null,
    client: string,
    result: string,
  ) {
    return {
      id,
      slug: id,
      category: { id: 'c', slug: 'commerce', name: loc('تجارة', 'Commerce') },
      coverMediaId: cover,
      clientName: client,
      projectUrl: null,
      status: 'published' as const,
      publishedAt: '2026-01-01',
      featured: false,
      sortOrder: 0,
      title: loc('مشروع', 'Project'),
      summary: loc('ملخّص', 'Summary'),
      challenge: loc('تحدٍّ', 'Challenge'),
      solution: loc(''),
      result: loc(result, result),
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
  }
  const work: SectionNode = {
    id: 'work',
    type: 'work',
    sortOrder: 0,
    published: true,
    eyebrow: loc('٠٤ · أعمالنا'),
    title: loc('أعمالٌ تتحدّث بالأرقام'),
    subtitle: loc('مشاريع أطلقناها'),
    blocks: [],
    config: { mode: 'featured', ids: [] },
    // the tree carries the section's portfolio records HYDRATED in-service — no `projects` prop
    collection: {
      collection: 'portfolio',
      items: [
        project('pay', 'm1', 'Acme', '−40% زمن'),
        project('shop', null, 'Globex', '3x مبيعات'),
      ],
    },
  };

  /** The exact composition `app/[locale]/page.tsx` renders for the swapped works orbit. */
  function renderWork(section: SectionNode, locale: 'ar' | 'en' = 'ar') {
    return render(
      <WebsiteShell locale={locale}>
        <WorksSection
          section={section}
          locale={locale}
          mode="live"
          anchorId="works"
          resolveImageUrl={(id) => (id === 'm1' ? 'https://cdn/x.jpg' : '')}
          slots={worksLiveSlots}
          Orbit={WorksOrbit}
        />
      </WebsiteShell>,
    );
  }

  it('renders the WEB10 orbit cards from the hydrated portfolio + the #works anchor + covers + .lp-flow', () => {
    setReducedMotion(true); // WorksOrbit settles to the static grid (WEB4) — no GSAP pin needed
    const { container } = renderWork(work, 'ar');
    // #works keeps the hero + CTA anchor glide resolving
    expect(
      container.querySelector('section#works.web-works'),
    ).toBeInTheDocument();
    // a card per hydrated project (byte-identical shared WorkCard DOM)
    expect(container.querySelectorAll('[data-orbit-card]').length).toBe(2);
    expect(
      [...container.querySelectorAll('.web-orbit-client')].map(
        (n) => n.textContent,
      ),
    ).toEqual(['Acme', 'Globex']);
    // the split metric renders (mono value + words)
    expect(screen.getByText('−40%')).toBeInTheDocument();
    // a cover img for the resolvable project, a placeholder frame for the other (never broken)
    expect(container.querySelectorAll('.web-orbit-cover-img').length).toBe(1);
    expect(
      container.querySelector('.web-orbit-cover-img')?.getAttribute('src'),
    ).toBe('https://cdn/x.jpg');
    expect(container.querySelectorAll('.web-orbit-cover-frame').length).toBe(1);
    // the head Reveal emits `.lp-flow` for the orbit's own reveal driver
    expect(container.querySelectorAll('.lp-flow').length).toBeGreaterThan(0);
  });

  it('links each card via the injected comet-flight TravelLink, locale-prefixed (en)', () => {
    setReducedMotion(true);
    renderWork(work, 'en');
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/en/portfolio/pay');
    expect(hrefs).toContain('/en/portfolio/shop');
  });

  it('renders nothing when the fallback section links no portfolio collection (F3)', () => {
    setReducedMotion(true);
    const { container } = renderWork(FALLBACK_WORK_SECTION, 'en');
    expect(container.querySelector('.web-works')).toBeNull();
  });
});

describe('landing live-swap — testimonials (shared @sanad/web-ui component)', () => {
  function quote(id: string, name: string, avatar: string | null, q: string) {
    return {
      id,
      authorName: name,
      companyName: 'Tadawul Pay',
      avatarMediaId: avatar,
      rating: 5,
      featured: false,
      sortOrder: 0,
      quote: loc(q, q),
      authorRole: loc('الرئيسة التنفيذية', 'CEO'),
      companyDescriptor: loc(''),
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
  }
  const testimonials: SectionNode = {
    id: 'testimonials',
    type: 'testimonials',
    sortOrder: 0,
    published: true,
    eyebrow: loc('٠٦ · إشاراتٌ واردة'),
    title: loc('ماذا يقول شركاؤنا بعد الإطلاق'),
    subtitle: loc(''),
    blocks: [],
    config: { mode: 'all', ids: [] },
    // the tree carries the testimonials HYDRATED in-service — no `testimonials` prop
    collection: {
      collection: 'testimonials',
      items: [
        quote('t1', 'ريم العتيبي', 'm1', 'فريقٌ يُسنِدك'),
        quote('t2', 'عمر ناصر', null, 'شراكةٌ حقيقية'),
      ],
    },
  };

  it('renders the quote cards from the hydrated collection + baked avatars + the .lp-flow reveal', () => {
    const { container } = render(
      <WebsiteShell locale="ar">
        <TestimonialsSection
          section={testimonials}
          locale="ar"
          mode="live"
          slots={testimonialsLiveSlots}
          resolveImageUrl={(id) => (id === 'm1' ? 'https://cdn/a.webp' : '')}
        />
      </WebsiteShell>,
    );
    expect(container.querySelector('.web-quotes')).toBeInTheDocument();
    expect(container.querySelectorAll('.web-quote').length).toBe(2);
    expect(screen.getByText('ريم العتيبي')).toBeInTheDocument();
    // a resolved avatar img for the one with an avatarMediaId, the gradient disc for the other
    expect(container.querySelectorAll('.web-avatar-img').length).toBe(1);
    expect(
      container.querySelector('.web-avatar-img')?.getAttribute('src'),
    ).toBe('https://cdn/a.webp');
    // the head + card Reveals emit `.lp-flow` for the ChapterStage reveal
    expect(container.querySelectorAll('.lp-flow').length).toBeGreaterThan(0);
  });

  it('renders nothing when the fallback section links no testimonials collection (F3)', () => {
    const { container } = render(
      <WebsiteShell locale="en">
        <TestimonialsSection
          section={FALLBACK_TESTIMONIALS_SECTION}
          locale="en"
          mode="live"
          slots={testimonialsLiveSlots}
        />
      </WebsiteShell>,
    );
    expect(container.querySelector('.web-quotes')).toBeNull();
  });
});

describe('landing live-swap — blog (shared @sanad/web-ui component)', () => {
  function post(
    id: string,
    slug: string,
    cover: string | null,
    title: string,
    published: string,
  ) {
    return {
      id,
      slug,
      category: { id: 'c', slug: 'eng', name: loc('هندسة', 'Engineering') },
      author: null,
      tags: [],
      coverMediaId: cover,
      status: 'published' as const,
      publishedAt: published,
      readMinutes: 5,
      sortOrder: 0,
      title: loc(title, title),
      excerpt: loc('مقتطف', 'Excerpt'),
      body: loc(''),
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
  }
  const blog: SectionNode = {
    id: 'blog',
    type: 'blog',
    sortOrder: 0,
    published: true,
    eyebrow: loc('٠٧ · سجل الرحلة'),
    title: loc('ممّا نتعلّمه ونحن نبني'),
    subtitle: loc(''),
    blocks: [],
    config: { mode: 'all', ids: [] },
    // the tree carries the posts HYDRATED in-service — no `posts` prop
    collection: {
      collection: 'blog',
      items: [
        post(
          'b1',
          'phases',
          'm1',
          'كيف نقسّم المنتج',
          '2026-03-14T00:00:00.000Z',
        ),
        post('b2', 'why', null, 'لماذا نبني', '2026-02-01T00:00:00.000Z'),
      ],
    },
  };

  /** The exact composition `app/[locale]/page.tsx` renders for the swapped blog teaser. */
  function renderBlog(section: SectionNode, locale: 'ar' | 'en' = 'ar') {
    return render(
      <WebsiteShell locale={locale}>
        <BlogSection
          section={section}
          locale={locale}
          mode="live"
          slots={blogLiveSlots}
          resolveImageUrl={(id) => (id === 'm1' ? 'https://cdn/c.webp' : '')}
          RowLink={blogRowLink(locale)}
          AllLink={blogAllLink(locale)}
        />
      </WebsiteShell>,
    );
  }

  it('renders the log rows from the hydrated collection + baked covers + comet-flight links + .lp-flow', () => {
    const { container } = renderBlog(blog, 'ar');
    expect(container.querySelector('.web-log-section')).toBeInTheDocument();
    expect(container.querySelectorAll('.web-log-row').length).toBe(2);
    expect(screen.getByText('كيف نقسّم المنتج')).toBeInTheDocument();
    expect(
      [...container.querySelectorAll('.web-log-date')].map(
        (n) => n.textContent,
      ),
    ).toEqual(['2026.03.14', '2026.02.01']);
    // a cover thumbnail for the one with a coverMediaId, none for the other
    expect(container.querySelectorAll('.web-log-cover-img').length).toBe(1);
    expect(
      container.querySelector('.web-log-cover-img')?.getAttribute('src'),
    ).toBe('https://cdn/c.webp');
    expect(container.querySelectorAll('.lp-flow').length).toBeGreaterThan(0);
  });

  it('links each row + the "all" header via the injected comet-flight TravelLink, locale-prefixed (en)', () => {
    renderBlog(blog, 'en');
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/en/blog/phases');
    expect(hrefs).toContain('/en/blog/why');
    expect(hrefs).toContain('/en/blog'); // the "all articles →" header link
  });

  it('shows the explicit empty state (never null) when the fallback links no collection (F3)', () => {
    const { container } = renderBlog(FALLBACK_BLOG_SECTION, 'en');
    expect(container.querySelector('.web-log-section')).toBeInTheDocument();
    expect(container.querySelector('.web-empty')).toBeInTheDocument();
  });
});
