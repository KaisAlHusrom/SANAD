import { trackingDestinationSettingKeys } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { fieldId, type SectionFormValues } from '../setting-form';
import {
  destinationStatus,
  isDoubleCounting,
  policyLinkPreview,
  toDestinationViews,
} from './tracking-view';

const ga4 = trackingDestinationSettingKeys('ga4');
const gtm = trackingDestinationSettingKeys('gtm');
const meta = trackingDestinationSettingKeys('metaPixel');

function values(entries: Record<string, string | boolean>): SectionFormValues {
  return Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [fieldId(key), value]),
  );
}

describe('destinationStatus', () => {
  const pattern = '^G-[A-Z0-9]{4,20}$';

  it('is off while the switch is off, whatever the id says', () => {
    expect(destinationStatus(false, 'G-ABCDE12345', pattern)).toBe('off');
    expect(destinationStatus(false, '', pattern)).toBe('off');
  });

  /**
   * The state a plain on/off switch hides, and the reason this page is not a key/value grid:
   * "on, with nothing to send" looks identical to "on and working" unless it is named.
   */
  it('is notConfigured when switched on with no id', () => {
    expect(destinationStatus(true, '', pattern)).toBe('notConfigured');
    expect(destinationStatus(true, '   ', pattern)).toBe('notConfigured');
  });

  it('is invalid when switched on with an id of the wrong shape', () => {
    expect(destinationStatus(true, 'GTM-ABCDE12', pattern)).toBe('invalid');
  });

  it('is live only when switched on with a well-shaped id', () => {
    expect(destinationStatus(true, 'G-ABCDE12345', pattern)).toBe('live');
    expect(destinationStatus(true, '  G-ABCDE12345  ', pattern)).toBe('live');
  });
});

describe('toDestinationViews', () => {
  it('returns one view per destination, in registry order, even when nothing is set', () => {
    const views = toDestinationViews({});
    expect(views.map((view) => view.id)).toEqual([
      'ga4',
      'gtm',
      'metaPixel',
      'snapPixel',
      'tiktokPixel',
    ]);
    expect(views.every((view) => view.status === 'off')).toBe(true);
  });

  it('reads the live form values, not the server snapshot', () => {
    const views = toDestinationViews(
      values({ [ga4.enabled]: true, [ga4.id]: 'G-ABCDE12345' }),
    );
    expect(views.find((view) => view.id === 'ga4')?.status).toBe('live');
  });

  it('flags an id that could equally belong to another destination', () => {
    const views = toDestinationViews(
      values({ [meta.enabled]: true, [meta.id]: '123456789012345' }),
    );
    expect(
      views.find((view) => view.id === 'metaPixel')?.alsoLooksLike,
    ).toEqual(['tiktokPixel']);
  });

  it('never flags a destination against itself, and says nothing about a blank field', () => {
    const views = toDestinationViews(
      values({ [ga4.enabled]: true, [ga4.id]: 'G-ABCDE12345' }),
    );
    expect(views.find((view) => view.id === 'ga4')?.alsoLooksLike).toEqual([]);
    expect(views.find((view) => view.id === 'gtm')?.alsoLooksLike).toEqual([]);
  });
});

describe('isDoubleCounting', () => {
  it('warns when GA4 and GTM are both on — every session would count twice', () => {
    expect(
      isDoubleCounting(
        toDestinationViews(
          values({
            [ga4.enabled]: true,
            [ga4.id]: 'G-ABCDE12345',
            [gtm.enabled]: true,
            [gtm.id]: 'GTM-ABCDE12',
          }),
        ),
      ),
    ).toBe(true);
  });

  // It warns on "switched on", not on "working": a half-configured GTM is still a second
  // container an operator is in the middle of adding, and that is exactly when to say so.
  it('warns even when one of the two is not finished yet', () => {
    expect(
      isDoubleCounting(
        toDestinationViews(
          values({
            [ga4.enabled]: true,
            [ga4.id]: 'G-ABCDE12345',
            [gtm.enabled]: true,
          }),
        ),
      ),
    ).toBe(true);
  });

  it('stays quiet when only one of them is on', () => {
    expect(
      isDoubleCounting(
        toDestinationViews(
          values({ [ga4.enabled]: true, [ga4.id]: 'G-ABCDE12345' }),
        ),
      ),
    ).toBe(false);
  });
});

describe('policyLinkPreview', () => {
  it('shows a site path under the site origin WITH its locale segment', () => {
    expect(policyLinkPreview('https://sanad.example', '/privacy', 'ar')).toBe(
      'https://sanad.example/ar/privacy',
    );
  });

  it('tolerates a trailing slash on the configured site url', () => {
    expect(policyLinkPreview('https://sanad.example/', '/privacy', 'en')).toBe(
      'https://sanad.example/en/privacy',
    );
  });

  it('leaves an absolute url alone — no origin, no locale segment', () => {
    expect(
      policyLinkPreview(
        'https://sanad.example',
        'https://group.example/p',
        'ar',
      ),
    ).toBe('https://group.example/p');
  });

  it('shows nothing for an unset path', () => {
    expect(policyLinkPreview('https://sanad.example', '  ', 'ar')).toBeNull();
  });

  // The site url is itself an optional branding setting (F7) — the preview must degrade to a
  // relative target rather than rendering the string "null/ar/privacy".
  it('degrades to a relative target when no site url is configured', () => {
    expect(policyLinkPreview(null, '/privacy', 'ar')).toBe('/ar/privacy');
  });
});
