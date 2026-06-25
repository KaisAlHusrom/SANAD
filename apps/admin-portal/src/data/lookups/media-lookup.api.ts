import { createApi } from '@reduxjs/toolkit/query/react';
import type { MediaAsset, MediaListQuery, Paginated } from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

/**
 * A shared, read-only media bridge for cross-module pickers (W5). Branding (and future
 * content modules) consume THIS — never `modules/media/api` directly. Its own reducerPath
 * keeps the picker's cache decoupled from the media module's own list cache.
 */
export const mediaLookupApi = createApi({
  reducerPath: 'mediaLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchMediaLookup: builder.query<Paginated<MediaAsset>, MediaListQuery>({
      query: (params) => ({ url: '/media', params }),
    }),
  }),
});

export const { useSearchMediaLookupQuery } = mediaLookupApi;

registerApi(mediaLookupApi);
