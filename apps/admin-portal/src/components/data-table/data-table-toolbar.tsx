import { Check, Columns3, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { DataTableFilterControl } from './data-table-filter-control';
import type {
  DataTableColumn,
  FilterDef,
  UseListUrlStateResult,
} from './types';

interface DataTableToolbarProps<TRow> {
  list: UseListUrlStateResult;
  filters?: FilterDef[];
  searchable?: boolean;
  columns: DataTableColumn<TRow>[];
  hiddenColumns: Set<string>;
  onToggleColumn: (id: string) => void;
}

/**
 * The DataTable toolbar: debounced search box + whitelisted filter controls + a clear-all
 * (shown when filters are active) + a column-visibility menu. All state flows through
 * `useListUrlState` (URL) and the caller-owned visibility set.
 */
export function DataTableToolbar<TRow>({
  list,
  filters = [],
  searchable = true,
  columns,
  hiddenColumns,
  onToggleColumn,
}: DataTableToolbarProps<TRow>) {
  const { t } = useTranslation('uiKit');

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {searchable ? (
          <Input
            className="w-56"
            aria-label={t('table.search')}
            placeholder={t('table.search')}
            value={list.searchInput}
            onChange={(event) => list.setSearch(event.target.value)}
          />
        ) : null}
        {filters.map((filter) => (
          <DataTableFilterControl
            key={filter.key}
            filter={filter}
            value={list.state.filters[filter.key]}
            onChange={(value) => list.setFilter(filter.key, value)}
          />
        ))}
        {list.activeFilterCount > 0 ? (
          <Button type="button" variant="ghost" onClick={list.clearFilters}>
            <X className="size-4" aria-hidden="true" />
            {t('filter.clearAll')}
          </Button>
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="secondary">
            <Columns3 className="size-4" aria-hidden="true" />
            {t('table.columns')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {columns.map((column) => {
            const visible = !hiddenColumns.has(column.id);
            return (
              <DropdownMenuItem
                key={column.id}
                onSelect={(event) => {
                  event.preventDefault();
                  onToggleColumn(column.id);
                }}
              >
                {visible ? (
                  <Check className="size-4 text-accent" aria-hidden="true" />
                ) : (
                  <span className="size-4" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate">{column.header}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
