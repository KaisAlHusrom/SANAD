import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  FolderCreateRequest,
  MediaAsset,
  MediaFolder,
  MediaListQuery,
  Paginated,
  UploadConfirmBody,
  UploadSignRequest,
  UploadSignResult,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/**
 * Media endpoints (P4 surface). The envelope is unwrapped by `baseQueryWithAuth`. The
 * presigned R2 PUT does NOT live here — it bypasses the gateway/baseQuery entirely (see
 * `lib/put-to-r2.ts`). Mutations publish a domain event after success (W4); same-module
 * lists refresh via tag invalidation.
 */
export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['MediaAsset', 'MediaFolder'],
  endpoints: (builder) => ({
    signUpload: builder.mutation<UploadSignResult, UploadSignRequest>({
      query: (body) => ({ url: '/media/uploads', method: 'POST', body }),
    }),
    confirmUpload: builder.mutation<
      MediaAsset,
      { id: string; body: UploadConfirmBody }
    >({
      query: ({ id, body }) => ({
        url: `/media/uploads/${id}/confirm`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'MediaAsset', id: 'LIST' }],
      async onQueryStarted({ id }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'media.asset.uploaded', assetId: id });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    listMedia: builder.query<Paginated<MediaAsset>, MediaListQuery>({
      query: (params) => ({ url: '/media', params }),
      providesTags: (result) => [
        { type: 'MediaAsset', id: 'LIST' },
        ...(result?.items ?? []).map((asset) => ({
          type: 'MediaAsset' as const,
          id: asset.id,
        })),
      ],
    }),
    getMedia: builder.query<MediaAsset, string>({
      query: (id) => ({ url: `/media/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'MediaAsset', id }],
    }),
    deleteMedia: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/media/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'MediaAsset', id },
        { type: 'MediaAsset', id: 'LIST' },
      ],
      async onQueryStarted(id, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'media.asset.deleted', assetId: id });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    createFolder: builder.mutation<MediaFolder, FolderCreateRequest>({
      query: (body) => ({ url: '/media/folders', method: 'POST', body }),
      invalidatesTags: [{ type: 'MediaFolder', id: 'LIST' }],
    }),
    listFolders: builder.query<MediaFolder[], { parentId?: string } | void>({
      query: (params) => ({
        url: '/media/folders',
        params: params || undefined,
      }),
      providesTags: [{ type: 'MediaFolder', id: 'LIST' }],
    }),
  }),
});

export const {
  useSignUploadMutation,
  useConfirmUploadMutation,
  useListMediaQuery,
  useGetMediaQuery,
  useDeleteMediaMutation,
  useCreateFolderMutation,
  useListFoldersQuery,
} = mediaApi;

registerApi(mediaApi);
