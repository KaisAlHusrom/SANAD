import { Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  canManage: boolean;
}

/**
 * What you can do with what you've picked. It appears only once something is selected, and it
 * always says HOW MANY — a bulk delete that doesn't state its own scope is how people delete
 * more than they meant to.
 *
 * There is no "Move to…" button: moving is a drag onto a folder, and offering a second, worse
 * path to the same thing would just be two half-features.
 */
export function SelectionBar({
  count,
  onClear,
  onDelete,
  canManage,
}: SelectionBarProps) {
  const { t } = useTranslation('mediaExplorer');
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-card border border-accent-line bg-accent-soft px-3 py-2">
      <span className="text-sm font-medium text-accent">
        {t('selection.count', { count })}
      </span>
      <div className="ms-auto flex items-center gap-2">
        {canManage ? (
          <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="size-4" aria-hidden="true" />
            {t('selection.delete')}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <X className="size-4" aria-hidden="true" />
          {t('selection.clear')}
        </Button>
      </div>
    </div>
  );
}
