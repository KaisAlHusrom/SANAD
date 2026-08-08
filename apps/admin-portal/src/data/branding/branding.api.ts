import { createApi } from '@reduxjs/toolkit/query/react';
import type { BrandingRecord } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

/**
 * Reads the resolved visual-identity record (public `GET /branding`) so the portal can theme
 * ITSELF from the settings the owner edits — the brand primary/secondary drive the portal
 * accent, the logo/favicon/name drive the shell chrome. The `Branding` tag is invalidated on
 * `settings.updated` (see `use-branding-theme`) so a Save re-skins the portal instantly (W4).
 * The record is single-sourced in `@sanad/contracts` (U3) — no shape is invented here.
 */
export const brandingApi = createApi({
  reducerPath: 'brandingApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Branding'],
  endpoints: (builder) => ({
    getBranding: builder.query<BrandingRecord, void>({
      query: () => ({ url: '/branding' }),
      providesTags: ['Branding'],
    }),
  }),
});

export const { useGetBrandingQuery } = brandingApi;

registerApi(brandingApi);
