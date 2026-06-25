import { createApi } from '@reduxjs/toolkit/query/react';
import {
  buildPaginationMeta,
  type MediaFolder,
  type Paginated,
} from '@sanad/contracts';
import { registerApi } from '../api/api-registry';
import { baseQueryWithAuth } from '../api/base-query';

interface FolderSearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/**
 * A shared, read-only folder bridge for cross-module pickers (W5) — the media library's
 * own folders surfaced to ServerSelect callers WITHOUT importing `modules/media/api`. Its
 * own reducerPath keeps the picker cache decoupled from the media module's list cache.
 *
 * The gateway's `GET /media/folders` returns the full (small) folder list; until it accepts
 * `search`/`page`/`ids` params, this api adapts client-side (filter + slice) in
 * `transformResponse` — a documented interim (TODO: server-side folder search/paging once
 * the folder count warrants it).
 */
export const folderLookupApi = createApi({
  reducerPath: 'folderLookupApi',
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    searchFolderLookup: builder.query<Paginated<MediaFolder>, FolderSearchArg>({
      query: () => ({ url: '/media/folders' }),
      transformResponse: (
        folders: MediaFolder[],
        _meta,
        arg,
      ): Paginated<MediaFolder> => {
        const term = arg.search.trim().toLowerCase();
        const filtered = term
          ? folders.filter((folder) => folder.name.toLowerCase().includes(term))
          : folders;
        const start = (arg.page - 1) * arg.pageSize;
        return {
          items: filtered.slice(start, start + arg.pageSize),
          meta: buildPaginationMeta(filtered.length, arg.page, arg.pageSize),
        };
      },
    }),
    getFoldersByIds: builder.query<MediaFolder[], string[]>({
      query: () => ({ url: '/media/folders' }),
      transformResponse: (
        folders: MediaFolder[],
        _meta,
        ids: string[],
      ): MediaFolder[] => folders.filter((folder) => ids.includes(folder.id)),
    }),
  }),
});

export const { useSearchFolderLookupQuery, useGetFoldersByIdsQuery } =
  folderLookupApi;

registerApi(folderLookupApi);
