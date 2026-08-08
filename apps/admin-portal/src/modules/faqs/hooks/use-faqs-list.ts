import {
  faqCategorySchema,
  type FaqItem,
  type FaqListQuery,
} from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListFaqsQuery } from '../api/faqs.api';

interface UseFaqsListResult {
  list: UseListUrlStateResult;
  rows: FaqItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/** Map URL list state to the FAQs query; `category` is the one whitelisted filter (N7). */
function buildFaqsQuery(state: ListState): FaqListQuery {
  const category = faqCategorySchema.safeParse(state.filters.category);
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    // Default to the drag-reorder order so the list reflects sortOrder out of the box.
    sort: state.sort ?? 'sortOrder',
    ...(state.search ? { search: state.search } : {}),
    ...(category.success ? { category: category.data } : {}),
  };
}

/** FAQs list logic (U5): URL-sourced state + the FAQs query. */
export function useFaqsList(): UseFaqsListResult {
  const list = useListUrlState({ filterKeys: ['category'] });
  const { data, isLoading, isFetching, isError } = useListFaqsQuery(
    buildFaqsQuery(list.state),
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
