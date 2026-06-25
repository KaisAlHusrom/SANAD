import { hasPermission } from '@sanad/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectPermissions } from '../../data/auth/auth.slice';
import { useAppSelector } from '../../data/store/hooks';
import { Button } from '../ui/button';
import type { BulkAction } from './types';
import type { UseBulkSelectionResult } from './use-bulk-selection';

interface BulkActionsBarProps {
  selection: UseBulkSelectionResult;
  actions: BulkAction[];
}

/**
 * The sticky bulk-actions bar shown when ≥1 row is selected. Actions are RBAC-gated; each
 * runs over the selected ids and the selection clears ON SUCCESS only (kept on failure so
 * the user can retry — the action surfaces its own error toast).
 */
export function BulkActionsBar({ selection, actions }: BulkActionsBarProps) {
  const { t } = useTranslation('uiKit');
  const permissions = useAppSelector(selectPermissions);
  const [running, setRunning] = useState<string | null>(null);

  const visible = actions.filter(
    (action) =>
      !action.permission || hasPermission(permissions, action.permission),
  );
  if (selection.count === 0 || visible.length === 0) {
    return null;
  }

  const run = async (action: BulkAction): Promise<void> => {
    setRunning(action.key);
    try {
      await action.onRun(selection.selectedIds);
      selection.clear();
    } catch {
      // Kept selected; the action is responsible for surfacing the error (toast).
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-2 bg-surface-2 px-3 py-2">
      <span className="text-sm font-medium text-text">
        {t('bulk.selected', { count: selection.count })}
      </span>
      <div className="flex items-center gap-2">
        {visible.map((action) => (
          <Button
            key={action.key}
            type="button"
            variant="secondary"
            className={action.tone === 'danger' ? 'text-bad' : undefined}
            loading={running === action.key}
            onClick={() => run(action)}
          >
            {action.label}
          </Button>
        ))}
        <Button type="button" variant="ghost" onClick={selection.clear}>
          {t('bulk.clear')}
        </Button>
      </div>
    </div>
  );
}
