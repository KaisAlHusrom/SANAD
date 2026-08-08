import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  ContentId,
  MenuCreateRequest,
  MenuItemCreateRequest,
  MenuItemNode,
  MenuItemUpdateRequest,
  MenuKey,
  MenuSummary,
  MenuTree,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/** Item mutations carry the owning menu `key` so the editor's tree query re-fetches (W3). */
export type MenuItemCreateArg = {
  body: MenuItemCreateRequest;
  menuKey: MenuKey;
};
export type MenuItemUpdateArg = {
  id: string;
  body: Omit<MenuItemUpdateRequest, 'id'>;
  menuKey: MenuKey;
};
export type MenuItemDeleteArg = { id: string; menuKey: MenuKey };
export type MenuItemReorderArg = { ids: string[]; menuKey: MenuKey };

async function publishOnSuccess(
  queryFulfilled: Promise<unknown>,
): Promise<void> {
  try {
    await queryFulfilled;
    eventBus.publish({ type: 'content.menu.changed' });
  } catch {
    // surfaced to the caller via `.unwrap()`
  }
}

/**
 * The navigation-menus CMS api (W3). The admin list (`GET /content/menus`) tells which keyed
 * menus exist; the editor loads a menu's one-level item tree (`GET /content/menus/:key`).
 * Menus are created on demand; items are created/updated/deleted/reordered individually. Every
 * write publishes `content.menu.changed` (W4) and re-fetches the affected menu tree.
 */
export const menusApi = createApi({
  reducerPath: 'menusApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Menu', 'MenuTree'],
  endpoints: (builder) => ({
    listMenus: builder.query<MenuSummary[], void>({
      query: () => ({ url: '/content/menus' }),
      providesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
    getMenuTree: builder.query<MenuTree, MenuKey>({
      query: (key) => ({ url: `/content/menus/${key}` }),
      providesTags: (_result, _error, key) => [{ type: 'MenuTree', id: key }],
    }),
    createMenu: builder.mutation<MenuSummary, MenuCreateRequest>({
      query: (body) => ({ url: '/content/menus', method: 'POST', body }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'Menu', id: 'LIST' },
        { type: 'MenuTree', id: body.key },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
    createMenuItem: builder.mutation<MenuItemNode, MenuItemCreateArg>({
      query: ({ body }) => ({
        url: '/content/menu-items',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { menuKey }) => [
        { type: 'MenuTree', id: menuKey },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
    updateMenuItem: builder.mutation<MenuItemNode, MenuItemUpdateArg>({
      query: ({ id, body }) => ({
        url: `/content/menu-items/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { menuKey }) => [
        { type: 'MenuTree', id: menuKey },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
    deleteMenuItem: builder.mutation<ContentId, MenuItemDeleteArg>({
      query: ({ id }) => ({
        url: `/content/menu-items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { menuKey }) => [
        { type: 'MenuTree', id: menuKey },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
    reorderMenuItems: builder.mutation<{ ids: string[] }, MenuItemReorderArg>({
      query: ({ ids }) => ({
        url: '/content/menu-items/reorder',
        method: 'PATCH',
        body: { ids },
      }),
      invalidatesTags: (_result, _error, { menuKey }) => [
        { type: 'MenuTree', id: menuKey },
      ],
      async onQueryStarted(_arg, { queryFulfilled }) {
        await publishOnSuccess(queryFulfilled);
      },
    }),
  }),
});

export const {
  useListMenusQuery,
  useGetMenuTreeQuery,
  useCreateMenuMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useReorderMenuItemsMutation,
} = menusApi;

registerApi(menusApi);
