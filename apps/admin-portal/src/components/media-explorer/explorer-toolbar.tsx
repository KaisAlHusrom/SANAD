import { FolderPlus, Grid2x2, List, Search, Upload, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SelectField } from '../ui/select';
import { EXPLORER_TYPE_OPTIONS } from './media-explorer.constants';
import type { ExplorerViewMode } from './use-explorer-nav-state';

/** Sentinel for "all types" — Radix forbids an empty-string item value. */
const ALL_TYPES = '__all__';

interface ExplorerToolbarProps {
  search: string;
  onSearch: (term: string) => void;
  type: string | undefined;
  onType: (type: string | undefined) => void;
  /** Hidden when the surface is locked to one family (an image field's picker). */
  showTypeFilter: boolean;
  view: ExplorerViewMode;
  onView: (view: ExplorerViewMode) => void;
  canManage: boolean;
  isUploading: boolean;
  onNewFolder: () => void;
  onUpload: () => void;
}

/**
 * Search, filter, switch view, and the two write actions. Read-only users still see the whole
 * toolbar minus the write actions, with the reason stated once in the content pane — a button
 * that silently vanishes leaves someone hunting for a feature they simply aren't allowed (U23c).
 */
export function ExplorerToolbar({
  search,
  onSearch,
  type,
  onType,
  showTypeFilter,
  view,
  onView,
  canManage,
  isUploading,
  onNewFolder,
  onUpload,
}: ExplorerToolbarProps) {
  const { t } = useTranslation('mediaExplorer');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        {/* Logical inset — the icon sits at the start of the field in both directions (U7). */}
        <Search
          className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-faint"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={t('toolbar.searchPlaceholder')}
          aria-label={t('toolbar.searchPlaceholder')}
          className="h-9 ps-9 pe-9"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch('')}
            aria-label={t('toolbar.clearSearch')}
            className="absolute inset-y-0 end-2 my-auto inline-flex size-6 items-center justify-center rounded-xs text-faint transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showTypeFilter ? (
        <SelectField
          size="sm"
          aria-label={t('toolbar.type')}
          className="w-36"
          value={type ?? ALL_TYPES}
          onValueChange={(next) =>
            onType(next === ALL_TYPES ? undefined : next)
          }
          options={EXPLORER_TYPE_OPTIONS.map((option) => ({
            value: option.value ?? ALL_TYPES,
            label: t(option.labelKey),
          }))}
        />
      ) : null}

      <div
        role="group"
        aria-label={t('toolbar.grid')}
        className="flex items-center rounded-input border border-border-2 p-0.5"
      >
        <ViewButton
          label={t('toolbar.grid')}
          isActive={view === 'grid'}
          onClick={() => onView('grid')}
        >
          <Grid2x2 className="size-4" aria-hidden="true" />
        </ViewButton>
        <ViewButton
          label={t('toolbar.list')}
          isActive={view === 'list'}
          onClick={() => onView('list')}
        >
          <List className="size-4" aria-hidden="true" />
        </ViewButton>
      </div>

      {canManage ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onNewFolder}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
            {t('toolbar.newFolder')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onUpload}
            loading={isUploading}
          >
            <Upload className="size-4" aria-hidden="true" />
            {t('toolbar.upload')}
          </Button>
        </>
      ) : null}
    </div>
  );
}

function ViewButton({
  label,
  isActive,
  onClick,
  children,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line',
        isActive ? 'bg-accent-soft text-accent' : 'text-faint hover:text-text',
      )}
    >
      {children}
    </button>
  );
}
