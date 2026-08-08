import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { selectOption } from '../../test/select-option';
import { DataTablePagination } from './data-table-pagination';
import type { ListState, UseListUrlStateResult } from './types';

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

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('DataTablePagination', () => {
  it('shows the "showing X–Y of Z" range', () => {
    renderWithProviders(
      <DataTablePagination
        list={makeList({ page: 2, pageSize: 20 })}
        total={45}
      />,
    );
    expect(screen.getByText('Showing 21–40 of 45')).toBeInTheDocument();
  });

  it('navigates with next / first / last', async () => {
    const setPage = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DataTablePagination
        list={makeList({ page: 2 }, { setPage })}
        total={200}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(setPage).toHaveBeenCalledWith(3);
    await user.click(screen.getByRole('button', { name: 'First page' }));
    expect(setPage).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(setPage).toHaveBeenCalledWith(10);
  });

  it('disables first/previous on the first page', () => {
    renderWithProviders(
      <DataTablePagination list={makeList({ page: 1 })} total={200} />,
    );
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
  });

  it('changes the page size', async () => {
    const setPageSize = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DataTablePagination list={makeList({}, { setPageSize })} total={100} />,
    );
    await selectOption(user, 'Rows per page', '50');
    expect(setPageSize).toHaveBeenCalledWith(50);
  });
});
