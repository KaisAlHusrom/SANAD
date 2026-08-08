import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import { EXPLORER_SEARCH_DEBOUNCE_MS } from './media-explorer.constants';

/** Thumbnails or a details list — a per-user preference, remembered for the session. */
export type ExplorerViewMode = 'grid' | 'list';

/**
 * Where the explorer is rendered. The distinction is not cosmetic: a modal must never rewrite
 * the page's URL (the form behind it owns that), so only the page mirrors its position there.
 */
export type ExplorerMode = 'page' | 'picker';

export interface ExplorerNavState {
  /** The open folder; `null` is the library root ("All files"). */
  folderId: string | null;
  view: ExplorerViewMode;
  /** A MIME prefix (`image`, `video`…), or undefined for everything. */
  type: string | undefined;
  /** What the user has typed — immediate, for the input's own value. */
  searchInput: string;
  /** The debounced term actually queried. */
  search: string;
  page: number;
  openFolder: (folderId: string | null) => void;
  setView: (view: ExplorerViewMode) => void;
  setType: (type: string | undefined) => void;
  setSearch: (term: string) => void;
  setPage: (page: number) => void;
}

const PARAM_FOLDER = 'folder';
const PARAM_VIEW = 'view';
const PARAM_TYPE = 'type';
const PARAM_SEARCH = 'q';
const PARAM_PAGE = 'page';

function isViewMode(value: string | null): value is ExplorerViewMode {
  return value === 'grid' || value === 'list';
}

/** The state to start from: the URL in page mode, plain defaults for the picker (and on the server). */
function readInitial(syncsUrl: boolean): {
  folderId: string | null;
  view: ExplorerViewMode;
  type: string | undefined;
  search: string;
  page: number;
} {
  const defaults = {
    folderId: null,
    view: 'grid' as ExplorerViewMode,
    type: undefined,
    search: '',
    page: 1,
  };
  if (!syncsUrl || typeof window === 'undefined') return defaults;

  const params = new URLSearchParams(window.location.search);
  const view = params.get(PARAM_VIEW);
  return {
    folderId: params.get(PARAM_FOLDER),
    view: isViewMode(view) ? view : 'grid',
    type: params.get(PARAM_TYPE) ?? undefined,
    search: params.get(PARAM_SEARCH) ?? '',
    page: Number(params.get(PARAM_PAGE)) || 1,
  };
}

/**
 * The explorer's "where am I" state (U5), and — on the page only — its reflection in the URL.
 *
 * The URL is written with `history.replaceState`, deliberately: an explorer is navigated by
 * clicking through a dozen folders, and pushing each one would turn the browser's Back button into
 * an undo key for folder clicks rather than a way to leave the page. What it buys is the thing that
 * matters — a reloaded or shared link opens the same folder, view and search.
 *
 * It reads/writes the URL through `window.history` rather than react-router's `useSearchParams`,
 * ON PURPOSE: the picker modal is rendered by the global modal manager, which sits OUTSIDE the
 * Router — so `useSearchParams` there throws "useLocation() may be used only in the context of a
 * <Router>" and blanks the whole app (found by driving the picker live). `history.replaceState`
 * updates the query string in place without needing router context and without provoking a route
 * change, which is exactly the "mirror, don't navigate" behaviour the page wants anyway.
 */
export function useExplorerNavState(mode: ExplorerMode): ExplorerNavState {
  const syncsUrl = mode === 'page';

  // Read the URL once, at mount: from then on this state is the source of truth and the URL is
  // its mirror. Two-way binding here would fight the debounce and the picker's isolation.
  const initial = useRef<{
    folderId: string | null;
    view: ExplorerViewMode;
    type: string | undefined;
    search: string;
    page: number;
  }>(readInitial(syncsUrl));

  const [folderId, setFolderId] = useState<string | null>(
    initial.current.folderId,
  );
  const [view, setViewState] = useState<ExplorerViewMode>(initial.current.view);
  const [type, setTypeState] = useState<string | undefined>(
    initial.current.type,
  );
  const [searchInput, setSearchInput] = useState(initial.current.search);
  const [page, setPageState] = useState(initial.current.page);

  const search = useDebouncedValue(searchInput, EXPLORER_SEARCH_DEBOUNCE_MS);

  // Any narrowing of the result set starts again at page 1 (F5), or the user lands on an empty
  // page 3 of a two-page folder and reads it as "nothing here".
  const openFolder = useCallback((next: string | null) => {
    setFolderId(next);
    setPageState(1);
  }, []);
  const setType = useCallback((next: string | undefined) => {
    setTypeState(next);
    setPageState(1);
  }, []);
  const setSearch = useCallback((term: string) => {
    setSearchInput(term);
    setPageState(1);
  }, []);

  useEffect(() => {
    if (!syncsUrl || typeof window === 'undefined') return;
    const next = new URLSearchParams(window.location.search);
    writeParam(next, PARAM_FOLDER, folderId);
    writeParam(next, PARAM_VIEW, view === 'grid' ? null : view);
    writeParam(next, PARAM_TYPE, type ?? null);
    writeParam(next, PARAM_SEARCH, search || null);
    writeParam(next, PARAM_PAGE, page > 1 ? String(page) : null);
    const query = next.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    // replaceState, not pushState: the query is a mirror of state, not a navigation (see above).
    window.history.replaceState(window.history.state, '', url);
  }, [syncsUrl, folderId, view, type, search, page]);

  return {
    folderId,
    view,
    type,
    searchInput,
    search,
    page,
    openFolder,
    setView: setViewState,
    setType,
    setSearch,
    setPage: setPageState,
  };
}

/** Set or drop a param — a default is expressed by its ABSENCE, never by `?view=grid`. */
function writeParam(
  params: URLSearchParams,
  key: string,
  value: string | null,
): void {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}
