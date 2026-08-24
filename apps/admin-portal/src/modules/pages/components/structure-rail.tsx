import {
  pickLocalized,
  sectionTypeSchema,
  type Locale,
  type SectionNode,
  type SectionType,
} from '@sanad/contracts';
import { ArrowLeft, Eye, EyeOff, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DragHandle, SortableList } from '../../../components/sortable';
import { Button } from '../../../components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet';
import { cn } from '../../../lib/cn';
import { AddTypeMenu } from './add-type-menu';
import { BlockList } from './block-list';
import { SectionConfigPanel } from './section-config-panel';

interface StructureRailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  sections: SectionNode[];
  canManage: boolean;
  locale: Locale;
  /** The section whose detail is open (`null` = the outline/master view). Also the canvas focus. */
  detailId: string | null;
  onSelectDetail: (id: string | null) => void;
  addSection: (type: SectionType) => Promise<string | undefined>;
  toggleVisibility: (section: SectionNode) => void;
  deleteSection: (section: SectionNode) => void;
  reorderSections: (orderedIds: string[]) => Promise<void>;
  reorderBlocks: (orderedIds: string[]) => Promise<void>;
  deleteBlock: (blockId: string) => void;
}

/**
 * The slide-in structural rail (Phase 4b) — the preview-first Studio's home for everything that isn't
 * inline copy/image editing. A **non-modal** `Sheet` (the canvas stays live behind it) with a
 * **master → detail** drill-down: the OUTLINE lists the page's sections (drag-reorder, add, hide/show,
 * delete, and click-to-focus the canvas), and drilling into one shows ITS collection config
 * (`SectionConfigPanel`) + blocks (`BlockList` → the typed block modal). One focused thing at a time,
 * full width for the pickers — reusing the same child components + the `usePageBuilder` mutations the
 * old strip/editor drove (F9). Selection (`detailId`) is shared with the canvas so the two stay in sync.
 */
export function StructureRail({
  open,
  onOpenChange,
  pageId,
  sections,
  canManage,
  locale,
  detailId,
  onSelectDetail,
  addSection,
  toggleVisibility,
  deleteSection,
  reorderSections,
  reorderBlocks,
  deleteBlock,
}: StructureRailProps) {
  const { t } = useTranslation('pages');
  const detailSection = sections.find((section) => section.id === detailId);

  const handleAdd = async (type: SectionType): Promise<void> => {
    const id = await addSection(type);
    if (id) onSelectDetail(id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        // Non-modal: keep the rail open while the owner edits copy on the canvas behind it.
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        aria-label={t('rail.title')}
      >
        {detailSection ? (
          <>
            <SheetHeader>
              <button
                type="button"
                onClick={() => onSelectDetail(null)}
                className="inline-flex items-center gap-1 text-sm text-dim hover:text-text"
              >
                <ArrowLeft
                  className="size-4 rtl:-scale-x-100"
                  aria-hidden="true"
                />
                {t('rail.back')}
              </button>
              <SheetTitle className="sr-only">{t('rail.title')}</SheetTitle>
              <div className="ms-auto flex items-center gap-1">
                {canManage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-bad hover:bg-bad-soft hover:text-bad"
                    onClick={() => deleteSection(detailSection)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    {t('actions.delete')}
                  </Button>
                ) : null}
                <RailClose
                  onClose={() => onOpenChange(false)}
                  label={t('rail.close')}
                />
              </div>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold text-text">
                  {pickLocalized(detailSection.title, locale) ||
                    t(`sectionTypes.${detailSection.type}`)}
                </h2>
                <span className="font-mono text-xs text-faint">
                  {detailSection.type}
                </span>
              </div>

              {canManage ? (
                <SectionConfigPanel pageId={pageId} section={detailSection} />
              ) : null}

              <div className="border-t border-border pt-4">
                <BlockList
                  section={detailSection}
                  pageId={pageId}
                  locale={locale}
                  canManage={canManage}
                  onReorder={reorderBlocks}
                  onDelete={deleteBlock}
                />
              </div>
            </SheetBody>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-sm font-semibold text-text">
                {t('rail.title')}
              </SheetTitle>
              <span className="ms-auto text-xs text-faint">
                {t('rail.sections', { count: sections.length })}
              </span>
              <RailClose
                onClose={() => onOpenChange(false)}
                label={t('rail.close')}
              />
            </SheetHeader>
            <SheetBody className="flex flex-col gap-3">
              {sections.length === 0 ? (
                <p className="rounded-input border border-dashed border-border px-4 py-6 text-center text-sm text-faint">
                  {t('rail.empty')}
                </p>
              ) : (
                <SortableList
                  items={sections}
                  getId={(section) => section.id}
                  onReorder={reorderSections}
                  disabled={!canManage}
                  className="flex flex-col gap-2"
                  renderItem={(section, handle) => {
                    const name =
                      pickLocalized(section.title, locale) ||
                      t(`sectionTypes.${section.type}`);
                    return (
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-input border bg-surface px-2.5 py-2 transition-colors',
                          section.id === detailId
                            ? 'border-accent-line ring-1 ring-accent-line'
                            : 'border-border hover:border-border-2',
                          !section.published && 'opacity-60',
                        )}
                      >
                        {handle ? (
                          <DragHandle
                            handle={handle}
                            label={t('section.dragHandle')}
                          />
                        ) : null}
                        <span
                          className={cn(
                            'size-1.5 shrink-0 rounded-full',
                            section.published ? 'bg-good' : 'bg-faint',
                          )}
                          aria-hidden="true"
                        />
                        <button
                          type="button"
                          onClick={() => onSelectDetail(section.id)}
                          className="flex min-w-0 flex-1 flex-col items-start text-start"
                        >
                          <span className="truncate text-sm font-medium text-text">
                            {name}
                          </span>
                          <span className="font-mono text-xs text-faint">
                            {section.type}
                          </span>
                        </button>
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleVisibility(section)}
                              aria-label={
                                section.published
                                  ? t('section.hide')
                                  : t('section.show')
                              }
                              className="grid size-7 place-items-center rounded-input text-faint hover:bg-surface-2 hover:text-text"
                            >
                              {section.published ? (
                                <Eye className="size-3.5" aria-hidden="true" />
                              ) : (
                                <EyeOff
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSection(section)}
                              aria-label={t('actions.delete')}
                              className="grid size-7 place-items-center rounded-input text-faint hover:bg-surface-2 hover:text-bad"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    );
                  }}
                />
              )}

              {canManage ? (
                <AddTypeMenu
                  label={t('section.add')}
                  options={sectionTypeSchema.options.map((value) => ({
                    value,
                    label: t(`sectionTypes.${value}`),
                  }))}
                  onSelect={(value) => void handleAdd(value as SectionType)}
                />
              ) : null}
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * The rail's dismiss control. `SheetContent` renders no built-in X (and non-modal drops the overlay),
 * so the header owns the only visible close affordance — an icon button that calls `onOpenChange(false)`
 * on the controlled state. Present in BOTH the outline + detail headers so it's always reachable.
 */
function RailClose({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      className="grid size-7 place-items-center rounded-input text-faint hover:bg-surface-2 hover:text-text"
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  );
}
