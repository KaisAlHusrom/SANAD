import { hasPermission } from '@sanad/contracts';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  MoreHorizontal,
} from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { selectPermissions } from '../../data/auth/auth.slice';
import { useAppSelector } from '../../data/store/hooks';
import { cn } from '../../lib/cn';
import { EmptyState } from '../feedback/empty-state';
import { ErrorState } from '../feedback/error-state';
import { RenderGate } from '../feedback/render-gate';
import { Skeleton } from '../feedback/skeleton';
import { Checkbox } from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { BulkActionsBar } from './bulk-actions-bar';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';
import type {
  BulkAction,
  DataTableColumn,
  FilterDef,
  RowAction,
  SortOrder,
  UseListUrlStateResult,
} from './types';
import type { UseBulkSelectionResult } from './use-bulk-selection';

export interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  getRowId: (row: TRow) => string;
  total: number;
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  empty?: ReactNode;
  list: UseListUrlStateResult;
  filters?: FilterDef[];
  searchable?: boolean;
  rowActions?: RowAction<TRow>[];
  bulkActions?: BulkAction[];
  selection?: UseBulkSelectionResult;
  onRowClick?: (row: TRow) => void;
  pageSizeOptions?: number[];
}

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) {
    return (
      <ChevronsUpDown className="size-3.5 text-faint" aria-hidden="true" />
    );
  }
  return order === 'asc' ? (
    <ArrowUp className="size-3.5 text-accent" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3.5 text-accent" aria-hidden="true" />
  );
}

function SkeletonRows({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border-2 last:border-0">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <td key={colIndex} className="px-3 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * The reusable list backbone (presentation; list state in `useListUrlState`, selection in
 * `useBulkSelection`). Composes the toolbar (search + filters + column visibility), a
 * sortable table with RBAC-gated per-row actions + tri-state selection, the RenderGate
 * states (skeleton → error → empty → data, F2), a bulk-actions bar, and pagination.
 * Tokens-only, RTL via logical properties (sort/pagination chevrons use `rtl:` variants).
 */
export function DataTable<TRow>({
  columns,
  rows,
  getRowId,
  total,
  isLoading,
  isError = false,
  errorMessage,
  empty,
  list,
  filters,
  searchable = true,
  rowActions,
  bulkActions,
  selection,
  onRowClick,
  pageSizeOptions,
}: DataTableProps<TRow>) {
  const { t } = useTranslation('uiKit');
  const permissions = useAppSelector(selectPermissions);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    () =>
      new Set(
        columns.filter((column) => column.hidden).map((column) => column.id),
      ),
  );
  const toggleColumn = useCallback((id: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const visibleColumns = columns.filter(
    (column) => !hiddenColumns.has(column.id),
  );
  const sortKeyOf = (column: DataTableColumn<TRow>): string =>
    column.sortKey ?? column.id;
  const colCount =
    visibleColumns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <DataTableToolbar
        list={list}
        filters={filters}
        searchable={searchable}
        columns={columns}
        hiddenColumns={hiddenColumns}
        onToggleColumn={toggleColumn}
      />

      {selection && bulkActions ? (
        <BulkActionsBar selection={selection} actions={bulkActions} />
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-2 bg-surface-2 text-dim">
              {selection ? (
                <th className="w-10 px-3 py-2">
                  <Checkbox
                    aria-label={t('table.selectAll')}
                    checked={
                      selection.isIndeterminate
                        ? 'indeterminate'
                        : selection.isAllSelected
                    }
                    onCheckedChange={() => selection.toggleAll()}
                  />
                </th>
              ) : null}
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-3 py-2 text-start font-medium',
                    column.align === 'end' && 'text-end',
                    column.align === 'center' && 'text-center',
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-text"
                      onClick={() => list.setSort(sortKeyOf(column))}
                    >
                      {column.header}
                      <SortIcon
                        active={list.state.sort === sortKeyOf(column)}
                        order={list.state.order}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {rowActions ? (
                <th className="w-10 px-3 py-2">
                  <span className="sr-only">{t('table.rowActions')}</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            <RenderGate
              isLoading={isLoading}
              isError={isError}
              isEmpty={rows.length === 0}
              skeleton={<SkeletonRows rows={5} cols={colCount} />}
              error={
                <tr>
                  <td colSpan={colCount} className="px-3 py-10">
                    <ErrorState
                      message={errorMessage ?? t('table.errorTitle')}
                    />
                  </td>
                </tr>
              }
              empty={
                <tr>
                  <td colSpan={colCount} className="px-3 py-10">
                    {empty ?? <EmptyState title={t('table.noResults')} />}
                  </td>
                </tr>
              }
            >
              {rows.map((row) => {
                const id = getRowId(row);
                const actions = (rowActions ?? []).filter(
                  (action) =>
                    (!action.permission ||
                      hasPermission(permissions, action.permission)) &&
                    !action.hidden?.(row),
                );
                return (
                  <tr
                    key={id}
                    className={cn(
                      'border-b border-border-2 last:border-0',
                      onRowClick && 'cursor-pointer hover:bg-surface-2',
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selection ? (
                      <td
                        className="px-3 py-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Checkbox
                          aria-label={t('table.selectRow')}
                          checked={selection.isSelected(id)}
                          onCheckedChange={() => selection.toggle(id)}
                        />
                      </td>
                    ) : null}
                    {visibleColumns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          'px-3 py-2 text-text',
                          column.align === 'end' && 'text-end',
                          column.align === 'center' && 'text-center',
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                    {rowActions ? (
                      <td
                        className="px-3 py-2 text-end"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {actions.length > 0 ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={t('table.rowActions')}
                                className="grid size-8 place-items-center rounded-input text-dim hover:bg-surface-2 hover:text-text"
                              >
                                <MoreHorizontal
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {actions.map((action) => (
                                <DropdownMenuItem
                                  key={action.key}
                                  className={
                                    action.tone === 'danger'
                                      ? 'text-bad'
                                      : undefined
                                  }
                                  onSelect={() => action.onSelect(row)}
                                >
                                  {action.icon}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </RenderGate>
          </tbody>
        </table>
      </div>

      <DataTablePagination
        list={list}
        total={total}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
