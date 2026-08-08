import type { BlogTagItem, BlogTagListQuery } from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListBlogTagsQuery } from '../api/blog-tags.api';

interface UseBlogTagsListResult {
  list: UseListUrlStateResult;
  rows: BlogTagItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/** Map the URL list state to the blog-tags query (no extra filters — search only). */
function buildTagsQuery(state: ListState): BlogTagListQuery {
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    // Default to the drag-reorder order so the list reflects sortOrder out of the box.
    sort: state.sort ?? 'sortOrder',
    ...(state.search ? { search: state.search } : {}),
  };
}

/** Blog-tags list logic (U5): URL-sourced list state + the tags query. */
export function useBlogTagsList(): UseBlogTagsListResult {
  const list = useListUrlState();
  const { data, isLoading, isFetching, isError } = useListBlogTagsQuery(
    buildTagsQuery(list.state),
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
