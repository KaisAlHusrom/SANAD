import type { BrandingRecord } from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Read the resolved branding / visual-identity record (WEB1/U9) — public, every leaf
 * always present (the resolver fills coded defaults), so reads are null-safe to the leaf
 * (F7). Drives the website's `--web-*` theme vars. Tagged so an admin branding save can
 * revalidate it on demand.
 */
export function getBranding(): Promise<BrandingRecord> {
  return fetchEnvelope<BrandingRecord>('/branding', {
    revalidate: 60,
    tags: ['branding'],
  });
}
