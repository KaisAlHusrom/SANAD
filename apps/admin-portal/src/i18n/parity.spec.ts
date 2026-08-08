import { describe, expect, it } from 'vitest';
import { i18n } from './index';
// Register every feature module's catalog so parity is checked across ALL namespaces
// (U8/F13), not just `common`. Add new modules here as they land.
import '../modules/auth/i18n';
import '../modules/integrations/i18n';
import '../modules/media/i18n';
import '../modules/settings/i18n';
import '../modules/services/i18n';
import '../modules/testimonials/i18n';
import '../modules/faqs/i18n';
import '../modules/team/i18n';
import '../modules/portfolio/i18n';
import '../modules/blog/i18n';
import '../modules/pages/i18n';
import '../modules/menus/i18n';
import '../modules/content-hub/i18n';
import '../modules/notifications/i18n';
import '../modules/leads/i18n';
import '../modules/dashboard/i18n';
import '../modules/users/i18n';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

const data = i18n.store.data as Record<string, Record<string, unknown>>;

describe('i18n catalog parity (U8)', () => {
  it('registers the common namespace', () => {
    expect(Object.keys(data.ar ?? {})).toContain('common');
  });

  it('has identical key trees across ar/en for every namespace', () => {
    for (const namespace of Object.keys(data.ar ?? {})) {
      const arKeys = flattenKeys(data.ar?.[namespace]).sort();
      const enKeys = flattenKeys(data.en?.[namespace] ?? {}).sort();
      expect(enKeys, `namespace "${namespace}"`).toEqual(arKeys);
    }
  });
});
