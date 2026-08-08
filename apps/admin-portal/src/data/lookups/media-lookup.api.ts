import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  MediaAsset,
  MediaListQuery,
  Paginated,
  PublicMediaRef,
} from '@sanad/contracts';
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
    // Resolve one asset by id so an id-valued picker (content `coverMediaId`/`avatarMediaId`)
    // can render the selected thumbnail without importing the media module's api (W5).
    getMediaLookupById: builder.query<MediaAsset, string>({
      query: (id) => ({ url: `/media/${id}` }),
    }),
    // Batch-resolve many ids → public CDN refs in ONE call (the same `GET /media/public` the website
    // uses), so the pages-builder preview can render section covers + `image` blocks (preview===live)
    // without N per-id fetches. Only `ready` assets resolve; unknown/pending ids are silently absent.
    resolvePublicMedia: builder.query<PublicMediaRef[], string[]>({
      query: (ids) => ({
        url: '/media/public',
        params: { ids: ids.join(',') },
      }),
    }),
  }),
});

export const {
  useSearchMediaLookupQuery,
  useGetMediaLookupByIdQuery,
  useResolvePublicMediaQuery,
} = mediaLookupApi;

registerApi(mediaLookupApi);
