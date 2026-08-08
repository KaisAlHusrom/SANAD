import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  BlockNode,
  BlockUpsertRequest,
  ContentId,
  ListQuery,
  Paginated,
  PageSummary,
  PageTree,
  PageUpsertRequest,
  ReorderRequest,
  SectionNode,
  SectionUpsertRequest,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** Section/block mutations carry the owning `pageId` so the builder's tree query re-fetches (W3). */
export type SectionUpsertArg = { body: SectionUpsertRequest; pageId: string };
export type BlockUpsertArg = { body: BlockUpsertRequest; pageId: string };
export type NodeDeleteArg = { id: string; pageId: string };
export type NodeReorderArg = { ids: string[]; pageId: string };

/** Re-publish `content.page.changed` (W4) after a successful page/section/block write. */
async function publishOnSuccess(
  queryFulfilled: Promise<unknown>,
): Promise<void> {
  try {
    await queryFulfilled;
    eventBus.publish({ type: 'content.page.changed' });
  } catch {
    // surfaced to the caller via `.unwrap()`
  }
}

/**
 * Optimistically merge an in-flight section/block edit into the cached draft tree so the preview
 * updates instantly (no revert-flicker while the inline editor saves); commit the change on success
 * and undo it on failure. Only merges the fields a partial edit carries; a create (no `id`) is left
 * for the invalidation refetch. Shared by the block-form modal and the Content Studio inline editor.
 */
async function optimisticTreeWrite(
  patch: { undo: () => void },
  queryFulfilled: Promise<unknown>,
): Promise<void> {
  try {
    await queryFulfilled;
    eventBus.publish({ type: 'content.page.changed' });
  } catch {
    patch.undo();
  }
}

/**
 * The pages-builder CMS api (W3). The flat admin list reads `GET /content/pages`; the builder
 * loads the **draft-visible** tree from `GET /content/pages/:id/tree` (the public `/pages/:slug`
 * hides drafts + unpublished sections). Page meta, sections and blocks are granular upserts;
 * every write publishes `content.page.changed` (W4) and re-fetches the affected page tree.
 */
export const pagesApi = createApi({
  reducerPath: 'pagesApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Page', 'PageTree'],
  endpoints: (builder) => ({
    listPages: builder.query<Paginated<PageSummary>, ListQuery>({
      query: (params) => ({ url: '/content/pages', params }),
      providesTags: (result) => [
        { type: 'Page', id: 'LIST' },
        ...(result?.items ?? []).map((page) => ({
          type: 'Page' as const,
          id: page.id,
        })),
      ],
    }),
    getPageTree: builder.query<PageTree, string>({
      query: (id) => ({ url: `/content/pages/${id}/tree` }),
      providesTags: (_result, _error, id) => [{ type: 'PageTree', id }],
    }),
    upsertPage: builder.mutation<PageSummary, PageUpsertRequest>({
      query: (body) => ({ url: '/content/pages', method: 'POST', body }),
      invalidatesTags: (result) => [
        { type: 'Page', id: 'LIST' },
        ...(result ? [{ type: 'PageTree' as const, id: result.id }] : []),
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
    deletePage: builder.mutation<ContentId, string>({
      query: (id) => ({ url: `/content/pages/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Page', id },
        { type: 'Page', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
    reorderPages: builder.mutation<ReorderRequest, ReorderRequest>({
      query: (body) => ({
        url: '/content/pages/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Page', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),

    upsertSection: builder.mutation<SectionNode, SectionUpsertArg>({
      query: ({ body }) => ({ url: '/content/sections', method: 'POST', body }),
      invalidatesTags: (_result, _error, { pageId }) => [
        { type: 'PageTree', id: pageId },
      ],
      async onQueryStarted({ body, pageId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          pagesApi.util.updateQueryData('getPageTree', pageId, (draft) => {
            if (!body.id) return;
            const target = draft.sections.find((s) => s.id === body.id);
            if (!target) return;
            if (body.eyebrow) target.eyebrow = body.eyebrow;
            if (body.title) target.title = body.title;
            if (body.subtitle) target.subtitle = body.subtitle;
            if (typeof body.published === 'boolean') {
              target.published = body.published;
            }
            // config edits from the collection panel — the re-fetch re-hydrates `collection`.
            if (body.config !== undefined) target.config = body.config;
          }),
        );
        await optimisticTreeWrite(patch, queryFulfilled);
      },
    }),
    deleteSection: builder.mutation<ContentId, NodeDeleteArg>({
      query: ({ id }) => ({ url: `/content/sections/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { pageId }) => [
        { type: 'PageTree', id: pageId },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
    reorderSections: builder.mutation<ReorderRequest, NodeReorderArg>({
      query: ({ ids }) => ({
        url: '/content/sections/reorder',
        method: 'PATCH',
        body: { ids },
      }),
      invalidatesTags: (_result, _error, { pageId }) => [
        { type: 'PageTree', id: pageId },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),

    upsertBlock: builder.mutation<BlockNode, BlockUpsertArg>({
      query: ({ body }) => ({ url: '/content/blocks', method: 'POST', body }),
      invalidatesTags: (_result, _error, { pageId }) => [
        { type: 'PageTree', id: pageId },
      ],
      async onQueryStarted({ body, pageId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          pagesApi.util.updateQueryData('getPageTree', pageId, (draft) => {
            if (!body.id) return;
            const target = draft.sections
              .flatMap((s) => s.blocks)
              .find((b) => b.id === body.id);
            if (!target) return;
            if (body.title) target.title = body.title;
            if (body.body) target.body = body.body;
            if (body.data) target.data = body.data;
            if (body.imageMediaId !== undefined) {
              target.imageMediaId = body.imageMediaId ?? null;
            }
          }),
        );
        await optimisticTreeWrite(patch, queryFulfilled);
      },
    }),
    deleteBlock: builder.mutation<ContentId, NodeDeleteArg>({
      query: ({ id }) => ({ url: `/content/blocks/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { pageId }) => [
        { type: 'PageTree', id: pageId },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
    reorderBlocks: builder.mutation<ReorderRequest, NodeReorderArg>({
      query: ({ ids }) => ({
        url: '/content/blocks/reorder',
        method: 'PATCH',
        body: { ids },
      }),
      invalidatesTags: (_result, _error, { pageId }) => [
        { type: 'PageTree', id: pageId },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
  }),
});

export const {
  useListPagesQuery,
  useGetPageTreeQuery,
  useUpsertPageMutation,
  useDeletePageMutation,
  useReorderPagesMutation,
  useUpsertSectionMutation,
  useDeleteSectionMutation,
  useReorderSectionsMutation,
  useUpsertBlockMutation,
  useDeleteBlockMutation,
  useReorderBlocksMutation,
} = pagesApi;

registerApi(pagesApi);
