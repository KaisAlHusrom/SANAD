import { hasPermission } from '@sanad/contracts';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  GripVertical,
  MoreHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
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
import { reorderRows } from './data-table-reorder';
import { DataTableSortableRow } from './data-table-sortable-row';
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

/**
 * Drag-and-drop reorder config (U21). When supplied, the table grows a leading grip-handle
 * column and rows become draggable — but only while the list is in its natural order (no
 * search/filter active and sorted by `sortKey`, default `sortOrder`); otherwise the handle
 * shows disabled with a hint, since a drag has no stable meaning over a filtered/re-sorted view.
 * `onReorder` receives the full new id order (server renumbers `sortOrder` to the index).
 */
export interface DataTableReorder {
  onReorder: (orderedIds: string[]) => Promise<void>;
  sortKey?: string;
}

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
  reorder?: DataTableReorder;
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
        <tr key={rowIndex} className="border-t border-border first:border-0">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
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
  reorder,
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

  // ===== drag-and-drop reorder (U21) =====
  const reorderActive = reorder != null;
  const reorderKey = reorder?.sortKey ?? 'sortOrder';
  // A drag only has a stable meaning over the natural order: no search/filter, sorted by the
  // order key (or unsorted). Otherwise the handle is shown disabled with a hint.
  const canDrag =
    reorderActive &&
    !list.state.search &&
    list.activeFilterCount === 0 &&
    (list.state.sort === undefined || list.state.sort === reorderKey);
  // Local optimistic order; cleared whenever the server row set changes (refetch after save).
  const [localOrder, setLocalOrder] = useState<TRow[] | null>(null);
  const serverIdsKey = rows.map(getRowId).join(',');
  useEffect(() => {
    setLocalOrder(null);
  }, [serverIdsKey]);
  const displayRows = localOrder ?? rows;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (!reorder || !over) {
      return;
    }
    const next = reorderRows(
      displayRows,
      String(active.id),
      String(over.id),
      getRowId,
    );
    if (!next) {
      return;
    }
    setLocalOrder(next);
    try {
      await reorder.onReorder(next.map(getRowId));
    } catch {
      setLocalOrder(null); // revert to the server order on failure
    }
  };

  const colCount =
    visibleColumns.length +
    (selection ? 1 : 0) +
    (rowActions ? 1 : 0) +
    (reorderActive ? 1 : 0);

  /** The selection + data + actions cells for one row (shared by static and sortable rows). */
  const renderCells = (row: TRow): ReactNode => {
    const id = getRowId(row);
    const actions = (rowActions ?? []).filter(
      (action) =>
        (!action.permission || hasPermission(permissions, action.permission)) &&
        !action.hidden?.(row),
    );
    return (
      <>
        {selection ? (
          <td
            className="px-4 py-3"
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
              'px-4 py-3 text-text',
              column.align === 'end' && 'text-end',
              column.align === 'center' && 'text-center',
            )}
          >
            {column.cell(row)}
          </td>
        ))}
        {rowActions ? (
          <td
            className="px-4 py-3 text-end"
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
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {actions.map((action) => (
                    <DropdownMenuItem
                      key={action.key}
                      className={
                        action.tone === 'danger' ? 'text-bad' : undefined
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
      </>
    );
  };

  const rowClassName = cn(
    'border-t border-border first:border-0 hover:bg-surface-2',
    onRowClick && 'cursor-pointer',
  );

  const tableCard = (
    // `overflow-x-auto`, never `overflow-hidden`: below desktop the table is wider than its card,
    // and `hidden` clips the trailing columns with NO way for a user to reach them — at tablet the
    // leads inbox lost its spam and received columns entirely (U0: a pane contains its own content).
    // Found by screenshotting, not by a test: the PAGE never overflowed, so every structural
    // assertion stayed green while the columns were unreachable (U21e).
    <div className="overflow-x-auto rounded-md border border-border bg-surface shadow-portal">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-faint">
            {reorderActive ? (
              <th className="w-10 px-2 py-3">
                <span className="sr-only">{t('table.dragHandle')}</span>
              </th>
            ) : null}
            {selection ? (
              <th className="w-10 px-4 py-3">
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
                  'px-4 py-3 text-start text-xs font-medium',
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
              <th className="w-10 px-4 py-3">
                <span className="sr-only">{t('table.rowActions')}</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          <RenderGate
            isLoading={isLoading}
            isError={isError}
            isEmpty={displayRows.length === 0}
            skeleton={<SkeletonRows rows={5} cols={colCount} />}
            error={
              <tr>
                <td colSpan={colCount} className="px-4 py-10">
                  <ErrorState message={errorMessage ?? t('table.errorTitle')} />
                </td>
              </tr>
            }
            empty={
              <tr>
                <td colSpan={colCount} className="px-4 py-10">
                  {empty ?? <EmptyState title={t('table.noResults')} />}
                </td>
              </tr>
            }
          >
            {canDrag ? (
              <SortableContext
                items={displayRows.map(getRowId)}
                strategy={verticalListSortingStrategy}
              >
                {displayRows.map((row) => (
                  <DataTableSortableRow
                    key={getRowId(row)}
                    id={getRowId(row)}
                    rowClassName={rowClassName}
                    handleLabel={t('table.dragHandle')}
                  >
                    {renderCells(row)}
                  </DataTableSortableRow>
                ))}
              </SortableContext>
            ) : (
              displayRows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={rowClassName}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {reorderActive ? (
                    <td className="w-10 px-2 py-3">
                      <span
                        aria-hidden="true"
                        title={t('table.reorderHint')}
                        className="grid size-8 cursor-not-allowed place-items-center text-faint"
                      >
                        <GripVertical className="size-4" />
                      </span>
                    </td>
                  ) : null}
                  {renderCells(row)}
                </tr>
              ))
            )}
          </RenderGate>
        </tbody>
      </table>
    </div>
  );

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

      {reorderActive && !canDrag ? (
        <p className="text-xs text-dim">{t('table.reorderHint')}</p>
      ) : null}

      {canDrag ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          {tableCard}
        </DndContext>
      ) : (
        tableCard
      )}

      <DataTablePagination
        list={list}
        total={total}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
}
