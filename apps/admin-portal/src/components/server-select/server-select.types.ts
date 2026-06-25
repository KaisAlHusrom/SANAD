import type { Paginated } from '@sanad/contracts';
import type { ReactNode } from 'react';

/** The arg passed to the caller's search query each render — RTK refetches when it changes. */
export interface ServerSelectSearchArg {
  search: string;
  page: number;
  pageSize: number;
}

/**
 * The caller's RTK query hook for browsing options (W5 — the kit imports no module api;
 * the caller wires its own `*-lookup.api`). Skipped while the popover is closed.
 */
export type ServerSelectSearchQuery<T> = (
  arg: ServerSelectSearchArg,
  options: { skip: boolean },
) => { data?: Paginated<T>; isFetching: boolean; isError: boolean };

/**
 * The caller's RTK query hook resolving already-selected ids to their items, so a saved
 * value renders its label even when it isn't on the current browse page (pinned first).
 * Cache it `staleTime: Infinity` in the lookup api. Skipped when nothing is selected.
 */
export type ServerSelectResolveQuery<T> = (
  ids: string[],
  options: { skip: boolean },
) => { data?: T[]; isFetching: boolean };

/** A normalized, render-ready option (value + label + the source item + optional rich node). */
export interface ServerSelectOption<T> {
  value: string;
  label: string;
  item: T;
  node: ReactNode;
}

export interface ServerSelectProps<T> {
  /** Selected value(s): a `string` (single) or `string[]` (multi); `undefined` = none. */
  value: string | string[] | undefined;
  onChange: (value: string | string[] | undefined) => void;
  multiple?: boolean;

  /** Data source (W5): the caller passes its own lookup-api query hooks. */
  useSearch: ServerSelectSearchQuery<T>;
  useResolveByIds: ServerSelectResolveQuery<T>;

  getOptionValue: (item: T) => string;
  getOptionLabel: (item: T) => string;
  /** Optional richer row renderer; falls back to the label text. */
  renderOption?: (item: T) => ReactNode;
  /** Single-mode side-channel: fires with the item on select + once when a prefill resolves. */
  onItemSelect?: (item: T | null) => void;

  pageSize?: number;
  /** Debounce (ms) before a typed query hits the server. Default 300. */
  searchDebounce?: number;
  /** Multi mode: chips shown before collapsing the rest into "+N more". Default 3. */
  maxDisplay?: number;

  disabled?: boolean;
  /** Show a clear (✕) control. Default true. */
  clearable?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  'aria-label'?: string;
  /** A field-level error message (RHF), rendered below the control. */
  error?: string;

  /** Quick-add: render a create button at the list foot; the caller opens its create flow. */
  onCreate?: () => void;
  createLabel?: string;
}
