import {
  blogPostStatusSchema,
  type BlogPostItem,
  type BlogPostListQuery,
} from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListBlogQuery } from '../api/blog.api';

interface UseBlogListResult {
  list: UseListUrlStateResult;
  rows: BlogPostItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/**
 * Map the URL list state to the whitelisted blog query (N7 — `status` validated). Reads the
 * draft-visible admin list (`/content/blog/manage`).
 */
function buildBlogQuery(state: ListState): BlogPostListQuery {
  const status = blogPostStatusSchema.safeParse(state.filters.status);
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    ...(state.sort ? { sort: state.sort } : {}),
    ...(state.search ? { search: state.search } : {}),
    ...(status.success ? { status: status.data } : {}),
  };
}

/**
 * Blog-posts list logic (U5): URL-sourced list state + the admin query; the page stays
 * presentational. `status` is the whitelisted filter (N7).
 */
export function useBlogList(): UseBlogListResult {
  const list = useListUrlState({ filterKeys: ['status'] });
  const { data, isLoading, isFetching, isError } = useListBlogQuery(
    buildBlogQuery(list.state),
  );

  return {
    list,
    rows: data?.items ?? [],
    total: data?.meta.total ?? 0,
    isLoading,
    isFetching,
    isError,
  };
}
