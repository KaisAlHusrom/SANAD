import type { PortfolioCategoryItem } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../store/store';
import { portfolioCategoryLookupApi } from './portfolio-category-lookup.api';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

const categories: PortfolioCategoryItem[] = [
  {
    id: 'cat-1',
    slug: 'web',
    sortOrder: 0,
    name: { ar: 'الويب', en: 'Web' },
    createdAt: 'x',
    updatedAt: 'x',
  },
  {
    id: 'cat-2',
    slug: 'mobile',
    sortOrder: 1,
    name: { ar: 'الجوال', en: 'Mobile' },
    createdAt: 'x',
    updatedAt: 'x',
  },
];

let calls: string[];

beforeEach(() => {
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: Request) => {
      calls.push(input.url);
      return Promise.resolve(
        jsonResponse({
          success: true,
          message: 'ok',
          data: {
            items: categories,
            meta: { page: 1, pageSize: 100, total: 2, totalPages: 1 },
          },
        }),
      );
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('portfolioCategoryLookupApi (W5 bridge for the project ServerSelect)', () => {
  it('omits a blank search param and passes a typed search through', async () => {
    const store = createAppStore();

    await store.dispatch(
      portfolioCategoryLookupApi.endpoints.searchPortfolioCategoryLookup.initiate(
        { search: '', page: 1, pageSize: 10 },
      ),
    );
    expect(calls[0]).toContain('/content/portfolio-categories');
    expect(calls[0]).not.toContain('search=');

    await store.dispatch(
      portfolioCategoryLookupApi.endpoints.searchPortfolioCategoryLookup.initiate(
        { search: 'web', page: 1, pageSize: 10 },
      ),
    );
    expect(calls.at(-1)).toContain('search=web');
  });

  it('resolves selected ids by filtering the fetched list (no by-id route)', async () => {
    const store = createAppStore();

    const result = await store.dispatch(
      portfolioCategoryLookupApi.endpoints.getPortfolioCategoriesByIds.initiate(
        ['cat-2'],
      ),
    );
    expect(result.data).toEqual([categories[1]]);
  });
});
