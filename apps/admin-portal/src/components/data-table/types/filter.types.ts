/** The filter kinds the DataTable toolbar renders. */
export type FilterKind =
  | 'select'
  | 'boolean'
  | 'search'
  | 'range'
  | 'date-range';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * A whitelisted, per-resource filter definition (N7 — never raw column passthrough). The
 * `key` is the URL param `useListUrlState` tracks; `label`/option labels are
 * caller-translated. `range`/`date-range` combine two inputs into one `from:to` param.
 */
export interface FilterDef {
  key: string;
  kind: FilterKind;
  label: string;
  options?: FilterOption[];
}
