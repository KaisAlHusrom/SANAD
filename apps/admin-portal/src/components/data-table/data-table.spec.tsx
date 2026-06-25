import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role } from '@sanad/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../data/auth/auth.slice';
import { createAppStore } from '../../data/store/store';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { DataTable } from './data-table';
import type {
  DataTableColumn,
  ListState,
  RowAction,
  UseListUrlStateResult,
} from './types';
import type { UseBulkSelectionResult } from './use-bulk-selection';

interface Row {
  id: string;
  name: string;
  status: string;
}

const rows: Row[] = [
  { id: 'r1', name: 'Alpha', status: 'draft' },
  { id: 'r2', name: 'Beta', status: 'published' },
];

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: (row) => row.name, sortable: true },
  { id: 'status', header: 'Status', cell: (row) => row.status },
];

function makeList(
  state: Partial<ListState> = {},
  setters: Partial<UseListUrlStateResult> = {},
): UseListUrlStateResult {
  return {
    state: {
      page: 1,
      pageSize: 20,
      search: '',
      sort: undefined,
      order: 'asc',
      filters: {},
      ...state,
    },
    searchInput: '',
    setSearch: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    setSort: vi.fn(),
    setFilter: vi.fn(),
    clearFilters: vi.fn(),
    activeFilterCount: 0,
    ...setters,
  };
}

function selection(
  over: Partial<UseBulkSelectionResult> = {},
): UseBulkSelectionResult {
  return {
    selectedIds: [],
    count: 0,
    isAllSelected: false,
    isIndeterminate: false,
    isSelected: () => false,
    toggle: vi.fn(),
    toggleAll: vi.fn(),
    clear: vi.fn(),
    ...over,
  };
}

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('DataTable', () => {
  it('renders headers and rows', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        total={2}
        isLoading={false}
        list={makeList()}
      />,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows skeleton rows while loading (no data flash)', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={[]}
        getRowId={(row) => row.id}
        total={0}
        isLoading
        list={makeList()}
      />,
    );
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows the error state with a friendly message', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={[]}
        getRowId={(row) => row.id}
        total={0}
        isLoading={false}
        isError
        errorMessage="Storage isn't configured."
        list={makeList()}
      />,
    );
    expect(screen.getByText("Storage isn't configured.")).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={[]}
        getRowId={(row) => row.id}
        total={0}
        isLoading={false}
        list={makeList()}
      />,
    );
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('sorts when a sortable header is clicked', async () => {
    const setSort = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        total={2}
        isLoading={false}
        list={makeList({}, { setSort })}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Name/ }));
    expect(setSort).toHaveBeenCalledWith('name');
  });

  it('toggles a row checkbox', async () => {
    const toggle = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        total={2}
        isLoading={false}
        list={makeList()}
        selection={selection({ toggle })}
      />,
      { store: storeWith(['manage']) },
    );
    const checks = screen.getAllByLabelText('Select row');
    await user.click(checks[0] as HTMLElement);
    expect(toggle).toHaveBeenCalledWith('r1');
  });

  it('hides the row-actions menu when the user lacks every action permission', () => {
    const rowActions: RowAction<Row>[] = [
      {
        key: 'edit',
        label: 'Edit',
        onSelect: vi.fn(),
        permission: 'content.manage',
      },
    ];
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        total={2}
        isLoading={false}
        list={makeList()}
        rowActions={rowActions}
      />,
      { store: storeWith(['content.read'], ['developer']) },
    );
    expect(
      screen.queryByRole('button', { name: 'Row actions' }),
    ).not.toBeInTheDocument();
  });

  it('runs a permitted row action', async () => {
    const onSelect = vi.fn();
    const rowActions: RowAction<Row>[] = [
      { key: 'edit', label: 'Edit', onSelect, permission: 'content.manage' },
    ];
    const user = userEvent.setup();
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        total={2}
        isLoading={false}
        list={makeList()}
        rowActions={rowActions}
      />,
      { store: storeWith(['manage']) },
    );
    const triggers = screen.getAllByRole('button', { name: 'Row actions' });
    await user.click(triggers[0] as HTMLElement);
    await user.click(await screen.findByText('Edit'));
    expect(onSelect).toHaveBeenCalledWith(rows[0]);
  });
});
