import { useEffect } from 'react';
import { pickLocalized } from '@sanad/contracts';
import {
  brandingApi,
  useGetBrandingQuery,
} from '../../data/branding/branding.api';
import { eventBus } from '../../data/events/event-bus';
import { useAppDispatch } from '../../data/store/hooks';
import { useDirection } from '../direction';
import {
  PORTAL_BRAND_STYLE_ID,
  renderPortalBrandCss,
} from '../../styles/portal-brand-css';
import {
  applyDocumentTitle,
  applyFavicon,
  upsertStyleElement,
} from './apply-brand-identity';

/**
 * Themes the portal FROM the owner's visual-identity settings (the point of the settings page):
 * the brand primary/secondary drive the portal accent, and the logo consumers + favicon + tab
 * title follow the brand. Re-fetches on `settings.updated` (published by the settings save, W4)
 * so a Save re-skins the running portal instantly — no reload. Every apply is null-safe (F7):
 * a missing leaf leaves the curated base token in place.
 */
export function useBrandingTheme(): void {
  const { data: branding } = useGetBrandingQuery();
  const { locale } = useDirection();
  const dispatch = useAppDispatch();

  // A settings Save happens in another module (settings.api) — bridge it (F5): invalidate the
  // Branding tag so this query refetches and the effects below re-apply the fresh identity.
  useEffect(
    () =>
      eventBus.subscribeTo('settings.updated', () => {
        dispatch(brandingApi.util.invalidateTags(['Branding']));
      }),
    [dispatch],
  );

  useEffect(() => {
    upsertStyleElement(PORTAL_BRAND_STYLE_ID, renderPortalBrandCss(branding));
  }, [branding]);

  useEffect(() => {
    if (branding?.faviconUrl) applyFavicon(branding.faviconUrl);
  }, [branding?.faviconUrl]);

  useEffect(() => {
    if (branding?.brand?.name) {
      applyDocumentTitle(pickLocalized(branding.brand.name, locale));
    }
  }, [branding, locale]);
}
