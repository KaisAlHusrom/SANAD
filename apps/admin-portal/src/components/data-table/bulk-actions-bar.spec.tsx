import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role } from '@sanad/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../data/auth/auth.slice';
import { createAppStore } from '../../data/store/store';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { BulkActionsBar } from './bulk-actions-bar';
import type { UseBulkSelectionResult } from './use-bulk-selection';

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

function selection(
  over: Partial<UseBulkSelectionResult> = {},
): UseBulkSelectionResult {
  return {
    selectedIds: ['a', 'b'],
    count: 2,
    isAllSelected: false,
    isIndeterminate: true,
    isSelected: () => false,
    toggle: vi.fn(),
    toggleAll: vi.fn(),
    clear: vi.fn(),
    ...over,
  };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('BulkActionsBar', () => {
  it('shows the selected count and runs an action, clearing on success', async () => {
    const onRun = vi.fn().mockResolvedValue(undefined);
    const clear = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <BulkActionsBar
        selection={selection({ clear })}
        actions={[
          { key: 'del', label: 'Delete', onRun, permission: 'content.manage' },
        ]}
      />,
      { store: storeWith(['content.manage']) },
    );
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onRun).toHaveBeenCalledWith(['a', 'b']);
    await waitFor(() => expect(clear).toHaveBeenCalled());
  });

  it('hides an action the user lacks permission for', () => {
    renderWithProviders(
      <BulkActionsBar
        selection={selection()}
        actions={[
          {
            key: 'del',
            label: 'Delete',
            onRun: vi.fn(),
            permission: 'content.manage',
          },
        ]}
      />,
      { store: storeWith(['content.read'], ['developer']) },
    );
    expect(
      screen.queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
  });

  it('keeps the selection when the action fails', async () => {
    const onRun = vi.fn().mockRejectedValue(new Error('nope'));
    const clear = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <BulkActionsBar
        selection={selection({ clear })}
        actions={[{ key: 'del', label: 'Delete', onRun }]}
      />,
      { store: storeWith(['manage']) },
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onRun).toHaveBeenCalled());
    expect(clear).not.toHaveBeenCalled();
  });
});
