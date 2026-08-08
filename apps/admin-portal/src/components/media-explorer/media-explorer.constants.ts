/**
 * The explorer's tuned numbers, in one place (U18 — no magic numbers at a call site).
 */

/**
 * Files fetched per page. Larger than the app-wide default because an explorer scrolls a wall of
 * thumbnails: the goal is that a folder fits on one page, not that the payload is tiny.
 */
export const EXPLORER_PAGE_SIZE = 48;

/** How long the search box waits before asking the server — the app-wide list debounce. */
export const EXPLORER_SEARCH_DEBOUNCE_MS = 300;

/** Newest first: in a media library the file you want is nearly always the one you just added. */
export const EXPLORER_SORT_FIELD = 'createdAt';

/** Indent per tree level, in rem — kept here so the tree and its skeleton can't drift apart. */
export const EXPLORER_TREE_INDENT_REM = 0.875;

/** How many folder rows the tree skeleton draws while loading. */
export const EXPLORER_TREE_SKELETON_ROWS = 5;

/** How many tiles the grid skeleton draws — roughly two rows at a typical width. */
export const EXPLORER_GRID_SKELETON_TILES = 10;

/**
 * The file grid's column template — the design canon's auto-filling wall of thumbnails.
 * Shared by the grid AND its loading skeleton, so the two can never drift and make the content
 * jump as it arrives.
 */
export const EXPLORER_GRID_COLUMNS =
  'grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]';

/**
 * The shortest the explorer may be on a page. A file manager needs room for a tree beside a wall
 * of files; below this it stops being one.
 */
export const EXPLORER_MIN_HEIGHT = 'min-h-[36rem]';

/**
 * The MIME-family filter offered in the toolbar; `value` undefined means "everything". The
 * explorer keeps its own copy rather than importing the media module's list, because a shared
 * component may not depend on a feature module (W5) — and the label keys are its own.
 */
export const EXPLORER_TYPE_OPTIONS: readonly {
  value: string | undefined;
  labelKey: string;
}[] = [
  { value: undefined, labelKey: 'types.all' },
  { value: 'image', labelKey: 'types.image' },
  { value: 'video', labelKey: 'types.video' },
  { value: 'audio', labelKey: 'types.audio' },
  { value: 'application', labelKey: 'types.document' },
];
