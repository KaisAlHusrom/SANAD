import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { SelectField } from '../ui/select';
import type { UseListUrlStateResult } from './types';
import { buildPaginationRange } from './pagination-range';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface DataTablePaginationProps {
  list: UseListUrlStateResult;
  total: number;
  pageSizeOptions?: number[];
}

/**
 * Pagination bar: "showing X–Y of Z" + page-size selector + first/prev/numbered/next/last
 * (ellipsis-aware). RTL: the directional chevrons flip via `rtl:` variants (no logical
 * property for transforms, U7); aria-labels make them direction-independent. Presentation
 * only — page state is the URL (`useListUrlState`).
 */
export function DataTablePagination({
  list,
  total,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps) {
  const { t } = useTranslation('uiKit');
  const { page, pageSize } = list.state;
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const range = buildPaginationRange(page, totalPages);

  const navButton =
    'grid size-8 place-items-center rounded-input border border-border-2 text-dim hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-sm text-dim">
        <span>{t('pagination.showing', { from, to, total })}</span>
        <label className="flex items-center gap-1.5">
          <span>{t('pagination.rowsPerPage')}</span>
          <SelectField
            aria-label={t('pagination.rowsPerPage')}
            size="xs"
            className="w-auto"
            value={String(pageSize)}
            onValueChange={(next) => list.setPageSize(Number(next))}
            options={pageSizeOptions.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
          />
        </label>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t('pagination.first')}
          className={navButton}
          disabled={page <= 1}
          onClick={() => list.setPage(1)}
        >
          <ChevronsLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={t('pagination.previous')}
          className={navButton}
          disabled={page <= 1}
          onClick={() => list.setPage(page - 1)}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        </button>
        {range.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-dim">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? 'page' : undefined}
              onClick={() => list.setPage(item)}
              className={cn(
                'grid size-8 place-items-center rounded-input border text-sm',
                item === page
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-border-2 text-dim hover:bg-surface-2 hover:text-text',
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label={t('pagination.next')}
          className={navButton}
          disabled={page >= totalPages}
          onClick={() => list.setPage(page + 1)}
        >
          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={t('pagination.last')}
          className={navButton}
          disabled={page >= totalPages}
          onClick={() => list.setPage(totalPages)}
        >
          <ChevronsRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
