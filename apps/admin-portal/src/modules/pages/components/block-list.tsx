import {
  blockTypeSchema,
  pickLocalized,
  type BlockNode,
  type BlockType,
  type Locale,
  type SectionNode,
} from '@sanad/contracts';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DragHandle, SortableList } from '../../../components/sortable';
import { Badge } from '../../../components/ui/badge';
import { useModalActions } from '../../../data/modal/use-modal';
import { AddTypeMenu } from './add-type-menu';
import { BLOCK_FORM_MODAL, type BlockFormModalData } from './block-form-modal';

/**
 * A section's blocks (U21) — a vertical drag-reorder list of typed blocks (grip, type badge,
 * localized title, edit + delete) plus the dashed "+ block" type picker. Add/edit open the
 * typed `BlockFormModal`; reorder + delete are driven by the builder.
 */
export function BlockList({
  section,
  pageId,
  locale,
  canManage,
  onReorder,
  onDelete,
}: {
  section: SectionNode;
  pageId: string;
  locale: Locale;
  canManage: boolean;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onDelete: (blockId: string) => void;
}) {
  const { t } = useTranslation('pages');
  const { open } = useModalActions();

  const openCreate = (type: BlockType): void => {
    const data: BlockFormModalData = {
      pageId,
      sectionId: section.id,
      type,
      nextSortOrder: section.blocks.length,
    };
    open(BLOCK_FORM_MODAL, data as unknown as Record<string, unknown>);
  };

  const openEdit = (node: BlockNode): void => {
    const data: BlockFormModalData = {
      pageId,
      sectionId: section.id,
      type: node.type,
      node,
      nextSortOrder: node.sortOrder,
    };
    open(BLOCK_FORM_MODAL, data as unknown as Record<string, unknown>);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">
          {t('block.list', { count: section.blocks.length })}
        </h3>
        {canManage ? (
          <AddTypeMenu
            label={t('block.add')}
            options={blockTypeSchema.options.map((value) => ({
              value,
              label: t(`blockTypes.${value}`),
            }))}
            onSelect={(value) => openCreate(value as BlockType)}
          />
        ) : null}
      </div>

      {section.blocks.length === 0 ? (
        <p className="rounded-input border border-dashed border-border px-4 py-6 text-center text-sm text-faint">
          {t('block.empty')}
        </p>
      ) : (
        <SortableList
          items={section.blocks}
          getId={(block) => block.id}
          onReorder={onReorder}
          disabled={!canManage}
          className="flex flex-col gap-2"
          renderItem={(block, handle) => (
            <div className="flex items-center gap-2 rounded-input border border-border bg-surface-2 px-3 py-2">
              {handle ? (
                <DragHandle handle={handle} label={t('block.dragHandle')} />
              ) : null}
              <Badge tone="neutral">{t(`blockTypes.${block.type}`)}</Badge>
              <span className="min-w-0 flex-1 truncate text-sm text-text">
                {pickLocalized(block.title, locale) || (
                  <span className="text-faint">{t('block.untitled')}</span>
                )}
              </span>
              {canManage ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(block)}
                    aria-label={t('actions.edit')}
                    className="grid size-7 place-items-center rounded-input text-dim hover:bg-surface hover:text-text"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(block.id)}
                    aria-label={t('actions.delete')}
                    className="grid size-7 place-items-center rounded-input text-dim hover:bg-surface hover:text-bad"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </div>
          )}
        />
      )}
    </div>
  );
}
