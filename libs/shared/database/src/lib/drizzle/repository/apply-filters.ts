import type { FilterSpec } from './filter-spec.js';
import type { RepoQuery } from './repo-query.js';

type Row = Record<string, unknown>;

/** Validated, flat query values (page/pageSize/sort already stripped by the caller). */
export type FilterValues = Record<string, unknown>;

/** Minimal structural contract for the cross-locale search dependency (avoids a circular import). */
export interface LocaleSearcher {
  searchAcrossLocales(field: string, term: string): Promise<string[]>;
}

/**
 * Apply ONLY whitelisted filters from a validated query object onto a `RepoQuery` (N7).
 * Column entries → `.where(field, op, value)`. The `search` entry → an OR of `contains`
 * over declared base columns, plus (for translatable specs) `id IN (searchAcrossLocales
 * matches)`. `undefined` values are skipped. Returns a NEW query (immutable builder); it
 * only ADDS conditions, so the soft-delete scope (N2) added later stays non-bypassable.
 */
export async function applyFilters<TSelect extends Row>(
  query: RepoQuery<TSelect>,
  values: FilterValues,
  spec: FilterSpec,
  /** Required only when a search entry declares `translatableFields`. */
  searcher?: LocaleSearcher,
): Promise<RepoQuery<TSelect>> {
  let q = query;
  for (const [param, entry] of Object.entries(spec)) {
    if (entry.kind === 'column') {
      const value = values[param];
      if (value === undefined) {
        continue;
      }
      q = q.where(entry.field, entry.op, value);
      continue;
    }

    // search
    const term = values[param];
    if (typeof term !== 'string' || term.length === 0) {
      continue;
    }
    const orConditions = entry.columns.map((col) =>
      q.condition(col, 'contains', term),
    );

    if (entry.translatableFields?.length && searcher) {
      const idSets = await Promise.all(
        entry.translatableFields.map((field) =>
          searcher.searchAcrossLocales(field, term),
        ),
      );
      const ids = [...new Set(idSets.flat())];
      if (ids.length > 0) {
        orConditions.push(q.condition('id', 'in', ids));
      } else if (orConditions.length === 0) {
        // No base-column search and no translation matched → force an empty result set.
        q = q.where('id', 'in', []);
        continue;
      }
    }

    q = q.whereAny(orConditions);
  }
  return q;
}
