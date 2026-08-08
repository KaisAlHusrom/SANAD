import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LeadCreateRequest } from '@sanad/contracts';
import { getPage } from './content';
import { getBranding } from './branding';
import { getMenu } from './menus';
import { createLead } from './leads';

const calls: Array<{ url: string; init?: RequestInit }> = [];

function ok(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, message: 'ok', data }),
  } as unknown as Response;
}

function stub(data: unknown) {
  calls.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return ok(data);
    }),
  );
}

/** Read a header off a recorded call — headers are set as a plain record by `fetchEnvelope`. */
function headerOf(
  call: { init?: RequestInit } | undefined,
  name: string,
): string | undefined {
  const headers = call?.init?.headers as Record<string, string> | undefined;
  return headers?.[name];
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('website data layer', () => {
  it('getPage reads the public page tree by slug', async () => {
    stub({ id: 'p1', slug: 'privacy', sections: [] });
    const page = await getPage('privacy');
    expect(page.slug).toBe('privacy');
    expect(calls[0]?.url).toBe('http://nginx/api/content/pages/privacy');
    expect(calls[0]?.init?.method).toBe('GET');
  });

  it('getBranding reads the public branding record (cached, tagged)', async () => {
    stub({ brand: { name: { ar: 'سند', en: 'Sanad' } } });
    await getBranding();
    expect(calls[0]?.url).toBe('http://nginx/api/branding');
    expect(
      (calls[0]?.init as { next?: { tags?: string[] } }).next?.tags,
    ).toContain('branding');
  });

  it('getMenu reads a keyed menu tree', async () => {
    stub({ key: 'primary', items: [] });
    const menu = await getMenu('primary');
    expect(menu.key).toBe('primary');
    expect(calls[0]?.url).toBe('http://nginx/api/content/menus/primary');
  });

  it('createLead POSTs the submission and returns the id (no-store)', async () => {
    stub({ id: 'lead-1' });
    const body: LeadCreateRequest = {
      name: 'Sara',
      email: 'sara@x.com',
      message: 'hi',
      source: 'contact',
      locale: 'ar',
    };
    const result = await createLead(body);
    expect(result.id).toBe('lead-1');
    expect(calls[0]?.url).toBe('http://nginx/api/leads');
    expect(calls[0]?.init?.method).toBe('POST');
    expect(calls[0]?.init?.cache).toBe('no-store');
    expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
      source: 'contact',
      locale: 'ar',
    });
  });

  it('createLead tells the backend which language to answer in (U24c)', async () => {
    // The visitor's page language decides the error text they'd see on a failed submit.
    stub({ id: 'lead-2' });
    await createLead({
      name: 'Sara',
      email: 'sara@x.com',
      message: 'hi',
      source: 'contact',
      locale: 'en',
    });
    expect(headerOf(calls[0], 'x-sanad-locale')).toBe('en');

    stub({ id: 'lead-3' });
    await createLead({
      name: 'سارة',
      email: 'sara@x.com',
      message: 'مرحباً',
      source: 'contact',
      locale: 'ar',
    });
    expect(headerOf(calls[0], 'x-sanad-locale')).toBe('ar');
  });
});
