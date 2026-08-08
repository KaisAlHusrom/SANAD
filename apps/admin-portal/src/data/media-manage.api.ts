import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  FolderCreateRequest,
  FolderDeleteStrategy,
  FolderUpdateRequest,
  MediaAsset,
  MediaFolder,
  MediaMoveRequest,
  MediaMoveResult,
  UploadConfirmBody,
  UploadSignRequest,
  UploadSignResult,
} from '@sanad/contracts';
import { registerApi } from './api/api-registry';
import { baseQueryWithAuth } from './api/base-query';
import { eventBus } from './events/event-bus';

/**
 * The shared *write* bridge for media (W5 — the mutation counterpart to the read-only
 * `media-lookup`/`folder-lookup` bridges). The reusable media-library modal (used from any
 * form) uploads and creates folders through THIS, never `modules/media/api` — so a shared
 * component never imports a feature module. The media module re-exports these hooks from its
 * own api to keep its call sites' import paths. The presigned R2 PUT itself bypasses the
 * gateway/baseQuery entirely (`lib/put-to-r2.ts`). Its own reducerPath keeps this cache
 * decoupled; cross-api refresh rides the event bus (W4).
 */
export const mediaManageApi = createApi({
  reducerPath: 'mediaManageApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['MediaFolder'],
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
      async onQueryStarted({ id }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'media.asset.uploaded', assetId: id });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    createFolder: builder.mutation<MediaFolder, FolderCreateRequest>({
      query: (body) => ({ url: '/media/folders', method: 'POST', body }),
      invalidatesTags: [{ type: 'MediaFolder', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          eventBus.publish({ type: 'media.folder.created', folderId: data.id });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    /**
     * Rename and/or re-parent — a rename in the tree, or a folder dragged onto another. The body
     * is passed through verbatim so the tri-state `parentId` survives: `{}` vs `{parentId: null}`
     * mean different things and must not be normalised here.
     */
    updateFolder: builder.mutation<
      MediaFolder,
      { id: string; body: FolderUpdateRequest }
    >({
      query: ({ id, body }) => ({
        url: `/media/folders/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'MediaFolder', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          eventBus.publish({ type: 'media.folder.changed', folderId: data.id });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    /**
     * `block` refuses a non-empty folder (and says what is inside); `reparent` lifts its contents
     * up one level first. Assets are never destroyed by either — deleting files is its own action.
     */
    deleteFolder: builder.mutation<
      { id: string },
      { id: string; strategy: FolderDeleteStrategy }
    >({
      query: ({ id, strategy }) => ({
        url: `/media/folders/${id}`,
        method: 'DELETE',
        params: { strategy },
      }),
      invalidatesTags: [{ type: 'MediaFolder', id: 'LIST' }],
      async onQueryStarted({ id }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'media.folder.changed', folderId: id });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    /**
     * Delete one asset. It lives on the shared bridge (alongside the media module's own
     * `deleteMedia`) because the explorer — a shared component — offers Delete from its
     * selection bar, and a shared component may not import a feature module's api (W5).
     */
    deleteAsset: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/media/${id}`, method: 'DELETE' }),
      async onQueryStarted(id, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'media.asset.deleted', assetId: id });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
    /** What a drag-and-drop onto a folder does — one bulk request for the whole selection. */
    moveAssets: builder.mutation<MediaMoveResult, MediaMoveRequest>({
      query: (body) => ({ url: '/media/move', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'MediaFolder', id: 'LIST' }],
      async onQueryStarted({ folderId }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'media.assets.moved', folderId });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const {
  useSignUploadMutation,
  useConfirmUploadMutation,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
  useDeleteAssetMutation,
  useMoveAssetsMutation,
} = mediaManageApi;

registerApi(mediaManageApi);
