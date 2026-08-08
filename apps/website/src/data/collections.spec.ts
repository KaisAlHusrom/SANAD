import { afterEach, describe, expect, it, vi } from 'vitest';
import { getServices } from './services';
import {
  getPortfolio,
  getPortfolioProject,
  getPortfolioCategories,
} from './portfolio';
import { getTestimonials } from './testimonials';
import {
  getBlogTeaser,
  getBlogPosts,
  getBlogPost,
  getBlogCategories,
} from './blog';
import { getFaqs } from './faq';

const calls: Array<{ url: string; init?: RequestInit }> = [];

function ok(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, message: 'ok', data }),
  } as unknown as Response;
}

/** Every collection endpoint returns the paginated `{ items, meta }` envelope. */
function stubPage(items: unknown[]) {
  calls.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return ok({
        items,
        meta: { page: 1, pageSize: 20, total: items.length },
      });
    }),
  );
}

/** A by-slug detail endpoint returns the entity directly (not a page). */
function stubItem(data: unknown) {
  calls.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return ok(data);
    }),
  );
}

function tagsOf(index = 0): string[] | undefined {
  return (calls[index]?.init as { next?: { tags?: string[] } }).next?.tags;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('website landing collection readers', () => {
  it('getServices unwraps the page to a ServiceItem[] (cached + tagged)', async () => {
    stubPage([{ id: 's1', slug: 'saas' }]);
    const services = await getServices();
    expect(services).toHaveLength(1);
    expect(services[0]?.slug).toBe('saas');
    expect(calls[0]?.url).toBe('http://nginx/api/content/services?pageSize=8');
    expect(calls[0]?.init?.method ?? 'GET').toBe('GET');
    expect(tagsOf()).toContain('content');
    expect(tagsOf()).toContain('services');
  });

  it('getServices honors an explicit limit', async () => {
    stubPage([]);
    await getServices(4);
    expect(calls[0]?.url).toBe('http://nginx/api/content/services?pageSize=4');
  });

  it('getPortfolio reads the public (published-forced) project list', async () => {
    stubPage([{ id: 'p1', slug: 'maarefa' }]);
    const works = await getPortfolio();
    expect(works[0]?.slug).toBe('maarefa');
    expect(calls[0]?.url).toBe('http://nginx/api/content/portfolio?pageSize=6');
    expect(tagsOf()).toContain('portfolio');
  });

  it('getPortfolio honors an explicit limit (the index reads more than the orbit)', async () => {
    stubPage([]);
    await getPortfolio(24);
    expect(calls[0]?.url).toBe(
      'http://nginx/api/content/portfolio?pageSize=24',
    );
  });

  it('getPortfolioProject reads a single published case study by slug (cached + tagged)', async () => {
    stubItem({ id: 'p1', slug: 'raseed', clientName: 'Raseed' });
    const project = await getPortfolioProject('raseed');
    expect(project.slug).toBe('raseed');
    expect(project.clientName).toBe('Raseed');
    expect(calls[0]?.url).toBe('http://nginx/api/content/portfolio/raseed');
    expect(calls[0]?.init?.method ?? 'GET').toBe('GET');
    expect(tagsOf()).toContain('portfolio');
    expect(tagsOf()).toContain('portfolio:raseed');
  });

  it('getPortfolioCategories unwraps the page to a category[] for the filter chips', async () => {
    stubPage([
      { id: 'c1', slug: 'payments', name: { ar: 'مدفوعات', en: 'Payments' } },
    ]);
    const categories = await getPortfolioCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0]?.slug).toBe('payments');
    expect(calls[0]?.url).toBe(
      'http://nginx/api/content/portfolio-categories?pageSize=50',
    );
    expect(tagsOf()).toContain('portfolio-categories');
  });

  it('getTestimonials reads the testimonials list', async () => {
    stubPage([{ id: 't1', authorName: 'Reem' }]);
    const items = await getTestimonials();
    expect(items[0]?.authorName).toBe('Reem');
    expect(calls[0]?.url).toBe(
      'http://nginx/api/content/testimonials?pageSize=4',
    );
    expect(tagsOf()).toContain('testimonials');
  });

  it('getBlogTeaser reads the first published posts', async () => {
    stubPage([{ id: 'b1', slug: 'phases' }]);
    const posts = await getBlogTeaser();
    expect(posts[0]?.slug).toBe('phases');
    expect(calls[0]?.url).toBe('http://nginx/api/content/blog?pageSize=3');
    expect(tagsOf()).toContain('blog');
  });

  it('getBlogPosts reads the public (published-forced) post list for the index', async () => {
    stubPage([{ id: 'b1', slug: 'weekly-meetings' }]);
    const posts = await getBlogPosts();
    expect(posts[0]?.slug).toBe('weekly-meetings');
    expect(calls[0]?.url).toBe('http://nginx/api/content/blog?pageSize=24');
    expect(tagsOf()).toContain('content');
    expect(tagsOf()).toContain('blog');
  });

  it('getBlogPosts honors an explicit limit', async () => {
    stubPage([]);
    await getBlogPosts(6);
    expect(calls[0]?.url).toBe('http://nginx/api/content/blog?pageSize=6');
  });

  it('getBlogPost reads a single published post by slug (cached + tagged)', async () => {
    stubItem({ id: 'b1', slug: 'weekly-meetings' });
    const post = await getBlogPost('weekly-meetings');
    expect(post.slug).toBe('weekly-meetings');
    expect(calls[0]?.url).toBe('http://nginx/api/content/blog/weekly-meetings');
    expect(calls[0]?.init?.method ?? 'GET').toBe('GET');
    expect(tagsOf()).toContain('blog');
    expect(tagsOf()).toContain('blog:weekly-meetings');
  });

  it('getBlogCategories unwraps the page to a category[] for the filter chips', async () => {
    stubPage([
      {
        id: 'c1',
        slug: 'engineering',
        name: { ar: 'الهندسة', en: 'Engineering' },
      },
    ]);
    const categories = await getBlogCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0]?.slug).toBe('engineering');
    expect(calls[0]?.url).toBe(
      'http://nginx/api/content/blog-categories?pageSize=50',
    );
    expect(tagsOf()).toContain('blog-categories');
  });

  it('getFaqs reads the public published FAQ list (cached + tagged)', async () => {
    stubPage([{ id: 'f1', category: 'process' }]);
    const faqs = await getFaqs();
    expect(faqs[0]?.category).toBe('process');
    expect(calls[0]?.url).toBe('http://nginx/api/content/faqs?pageSize=50');
    expect(calls[0]?.init?.method ?? 'GET').toBe('GET');
    expect(tagsOf()).toContain('content');
    expect(tagsOf()).toContain('faqs');
  });
});
