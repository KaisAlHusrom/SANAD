import {
  DEFAULT_PAGE_SIZE,
  type MediaAsset,
  type MediaListQuery,
  type PaginationMeta,
} from '@sanad/contracts';
import { useCallback, useState } from 'react';
import { useListMediaQuery } from '../api/media.api';

interface UseMediaListResult {
  items: MediaAsset[];
  meta: PaginationMeta | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  /** True when the list failed because R2 isn't configured (503) — drives a friendly message. */
  isStorageUnconfigured: boolean;
  page: number;
  setPage: (page: number) => void;
  folderId: string | undefined;
  setFolderId: (folderId: string | undefined) => void;
  type: string | undefined;
  setType: (type: string | undefined) => void;
}

/** Owns the media library filter/page state and builds the `listMedia` query (U5). */
export function useMediaList(): UseMediaListResult {
  const [page, setPage] = useState(1);
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [type, setType] = useState<string | undefined>(undefined);

  // changing a filter resets to the first page (F5)
  const changeFolder = useCallback((next: string | undefined) => {
    setFolderId(next);
    setPage(1);
  }, []);
  const changeType = useCallback((next: string | undefined) => {
    setType(next);
    setPage(1);
  }, []);

  const query: MediaListQuery = {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    order: 'asc',
    folderId,
    type,
  };
  const { data, isLoading, isError, isFetching, error } =
    useListMediaQuery(query);
  const isStorageUnconfigured = Boolean(
    error && 'status' in error && error.status === 503,
  );

  return {
    items: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    isError,
    isFetching,
    isStorageUnconfigured,
    page,
    setPage,
    folderId,
    setFolderId: changeFolder,
    type,
    setType: changeType,
  };
}
