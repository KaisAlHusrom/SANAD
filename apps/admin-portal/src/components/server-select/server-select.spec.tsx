import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { triggerIntersection } from '../../test/intersection-observer';
import { ServerSelect } from './server-select';
import type {
  ServerSelectResolveQuery,
  ServerSelectSearchQuery,
} from './server-select.types';

interface Item {
  id: string;
  name: string;
}

const ITEMS: Item[] = Array.from({ length: 25 }, (_, i) => ({
  id: `f${i + 1}`,
  name: `Folder ${i + 1}`,
}));

function searchMock(all: Item[] = ITEMS) {
  const cache = new Map<string, ReturnType<ServerSelectSearchQuery<Item>>>();
  const useSearch: ServerSelectSearchQuery<Item> = (arg, opts) => {
    const key = `${arg.search}|${arg.page}|${opts.skip}`;
    const cached = cache.get(key);
    if (cached) return cached;
    let result: ReturnType<ServerSelectSearchQuery<Item>>;
    if (opts.skip) {
      result = { data: undefined, isFetching: false, isError: false };
    } else {
      const filtered = arg.search
        ? all.filter((i) => i.name.includes(arg.search))
        : all;
      const start = (arg.page - 1) * arg.pageSize;
      result = {
        data: {
          items: filtered.slice(start, start + arg.pageSize),
          meta: {
            page: arg.page,
            pageSize: arg.pageSize,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / arg.pageSize),
          },
        },
        isFetching: false,
        isError: false,
      };
    }
    cache.set(key, result);
    return result;
  };
  return useSearch;
}

function resolveMock(all: Item[] = ITEMS): ServerSelectResolveQuery<Item> {
  const cache = new Map<string, ReturnType<ServerSelectResolveQuery<Item>>>();
  return (ids, opts) => {
    const key = `${ids.join(',')}|${opts.skip}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const result = opts.skip
      ? { data: undefined, isFetching: false }
      : { data: all.filter((i) => ids.includes(i.id)), isFetching: false };
    cache.set(key, result);
    return result;
  };
}

const base = {
  useSearch: searchMock(),
  useResolveByIds: resolveMock(),
  getOptionValue: (item: Item) => item.id,
  getOptionLabel: (item: Item) => item.name,
  pageSize: 10,
};

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('ServerSelect', () => {
  it('shows the placeholder and opens a listbox of options on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ServerSelect
        {...base}
        value={undefined}
        onChange={vi.fn()}
        placeholder="Pick a folder"
      />,
    );

    const trigger = screen.getByRole('combobox', { name: 'Pick a folder' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);

    expect(await screen.findByText('Folder 1')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('selects an option (single) and emits its value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ServerSelect
        {...base}
        value={undefined}
        onChange={onChange}
        placeholder="Pick"
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Pick' }));
    await user.click(await screen.findByText('Folder 2'));

    expect(onChange).toHaveBeenCalledWith('f2');
  });

  it('renders selected chips with a "+N more" overflow in multi mode', () => {
    renderWithProviders(
      <ServerSelect
        {...base}
        multiple
        maxDisplay={2}
        value={['f1', 'f2', 'f3', 'f4']}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Folder 1')).toBeInTheDocument();
    expect(screen.getByText('Folder 2')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('shows the no-results message for an empty search', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ServerSelect
        {...base}
        useSearch={searchMock()}
        value={undefined}
        onChange={vi.fn()}
        placeholder="Pick"
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Pick' }));
    await user.type(await screen.findByPlaceholderText(/search/i), 'zzz');

    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('loads the next page when the sentinel intersects', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ServerSelect
        {...base}
        useSearch={searchMock()}
        value={undefined}
        onChange={vi.fn()}
        placeholder="Pick"
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Pick' }));
    await screen.findByText('Folder 1');
    expect(screen.queryByText('Folder 11')).not.toBeInTheDocument();

    triggerIntersection();

    expect(await screen.findByText('Folder 11')).toBeInTheDocument();
  });

  it('renders a quick-add action and invokes onCreate', async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ServerSelect
        {...base}
        useSearch={searchMock()}
        value={undefined}
        onChange={vi.fn()}
        placeholder="Pick"
        onCreate={onCreate}
        createLabel="Add folder"
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Pick' }));
    await user.click(await screen.findByText('Add folder'));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('renders a field-level error message', () => {
    renderWithProviders(
      <ServerSelect
        {...base}
        value={undefined}
        onChange={vi.fn()}
        error="Required"
        placeholder="Pick"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('clears the selection', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ServerSelect
        {...base}
        value="f3"
        onChange={onChange}
        placeholder="Pick"
      />,
    );

    const trigger = screen.getByRole('combobox');
    expect(
      within(trigger.parentElement as HTMLElement).getByText('Folder 3'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
