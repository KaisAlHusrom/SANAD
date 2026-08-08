import {
  pickLocalized,
  type PageSummary,
  type SectionNode,
} from '@sanad/contracts';
import { ArrowLeft, PanelRight, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../../../components/feedback/empty-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { RenderGate } from '../../../components/feedback/render-gate';
import { Skeleton } from '../../../components/feedback/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useModalActions } from '../../../data/modal/use-modal';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import { useDirection } from '../../../providers/direction/use-direction';
import { usePageBuilder } from '../hooks/use-page-builder';
import { PAGE_FORM_MODAL } from './page-form-modal';
import { StructureRail } from './structure-rail';
import { StudioCanvas } from './studio-canvas';

const PAGES_PATH = '/content/pages';

/**
 * The preview-first Content Studio (Phase 4b): the whole page renders as a live editable **canvas**
 * (the SHARED `@sanad/web-ui` components — preview === live), edited **in place**; all structural
 * editing (add / reorder / hide / delete / collection-config / blocks) lives in a **slide-in
 * structural rail**. A single `detailId` drives BOTH the canvas focus/scroll and the rail's
 * master→detail view, so the two stay in sync. Loads the draft-visible tree; every write re-fetches.
 */
export function PageBuilderPage() {
  const { t } = useTranslation('pages');
  const { id = '' } = useParams<{ id: string }>();
  const { locale } = useDirection();
  const { open } = useModalActions();
  const canManage = useRequirePermission('content.manage');
  const {
    tree,
    isLoading,
    isError,
    addSection,
    toggleSectionVisibility,
    deleteSection,
    reorderSectionsTo,
    deleteBlock,
    reorderBlocksTo,
  } = usePageBuilder(id);

  const [railOpen, setRailOpen] = useState(false);
  // The focused section — drives the canvas scroll/highlight AND the rail's detail view (`null` = outline).
  const [detailId, setDetailId] = useState<string | null>(null);

  // Drop the detail selection if that section is gone (deleted, or a re-fetch removed it).
  const sections = tree?.sections;
  useEffect(() => {
    if (
      detailId &&
      sections &&
      !sections.some((s: SectionNode) => s.id === detailId)
    ) {
      setDetailId(null);
    }
  }, [detailId, sections]);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            to={PAGES_PATH}
            className="inline-flex w-fit items-center gap-1 text-sm text-dim hover:text-text"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            {t('builder.backToPages')}
          </Link>
          {tree ? (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-text">
                {pickLocalized(tree.title, locale) || tree.slug}
              </h1>
              <span className="font-mono text-sm text-faint">/{tree.slug}</span>
              <Badge tone={tree.status === 'published' ? 'good' : 'warn'} dot>
                {t(`status.${tree.status}`)}
              </Badge>
            </div>
          ) : null}
        </div>
        {tree && canManage ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              open(PAGE_FORM_MODAL, {
                item: {
                  id: tree.id,
                  slug: tree.slug,
                  status: tree.status,
                  sortOrder: tree.sortOrder,
                  title: tree.title,
                  createdAt: tree.createdAt,
                  updatedAt: tree.updatedAt,
                } satisfies PageSummary,
              })
            }
          >
            <Settings2 className="size-4" aria-hidden="true" />
            {t('builder.editMeta')}
          </Button>
        ) : null}
      </header>

      <RenderGate
        isLoading={isLoading}
        isError={isError}
        skeleton={<Skeleton className="h-64 w-full" />}
        error={<ErrorState message={t('builder.loadError')} />}
      >
        {tree ? (
          <>
            {tree.sections.length > 0 ? (
              <StudioCanvas
                tree={tree}
                canManage={canManage}
                focusedSectionId={detailId ?? undefined}
                onFocusSection={setDetailId}
                onOpenStructure={() => setRailOpen(true)}
              />
            ) : (
              <EmptyState
                title={t('studio.emptyTitle')}
                description={t('studio.emptyBody')}
                action={
                  canManage ? (
                    <Button type="button" onClick={() => setRailOpen(true)}>
                      <PanelRight className="size-4" aria-hidden="true" />
                      {t('studio.structure')}
                    </Button>
                  ) : undefined
                }
              />
            )}

            <StructureRail
              open={railOpen}
              onOpenChange={setRailOpen}
              pageId={tree.id}
              sections={tree.sections}
              canManage={canManage}
              locale={locale}
              detailId={detailId}
              onSelectDetail={setDetailId}
              addSection={addSection}
              toggleVisibility={toggleSectionVisibility}
              deleteSection={deleteSection}
              reorderSections={reorderSectionsTo}
              reorderBlocks={reorderBlocksTo}
              deleteBlock={deleteBlock}
            />
          </>
        ) : null}
      </RenderGate>
    </section>
  );
}
