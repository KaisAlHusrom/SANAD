import type { TestimonialItem, TestimonialListQuery } from '@sanad/contracts';
import type {
  ListState,
  UseListUrlStateResult,
} from '../../../components/data-table';
import { useListUrlState } from '../../../hooks/use-list-url-state';
import { useListTestimonialsQuery } from '../api/testimonials.api';

interface UseTestimonialsListResult {
  list: UseListUrlStateResult;
  rows: TestimonialItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

/** Map URL list state to the testimonials query; `featured` is the one whitelisted filter (N7). */
function buildTestimonialsQuery(state: ListState): TestimonialListQuery {
  const featured =
    state.filters.featured === 'true'
      ? true
      : state.filters.featured === 'false'
        ? false
        : undefined;
  return {
    page: state.page,
    pageSize: state.pageSize,
    order: state.order,
    // Default to the drag-reorder order so the list reflects sortOrder out of the box.
    sort: state.sort ?? 'sortOrder',
    ...(state.search ? { search: state.search } : {}),
    ...(featured !== undefined ? { featured } : {}),
  };
}

/** Testimonials list logic (U5): URL-sourced state + the testimonials query. */
export function useTestimonialsList(): UseTestimonialsListResult {
  const list = useListUrlState({ filterKeys: ['featured'] });
  const { data, isLoading, isFetching, isError } = useListTestimonialsQuery(
    buildTestimonialsQuery(list.state),
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
