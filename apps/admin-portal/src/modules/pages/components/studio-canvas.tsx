import {
  LOCALES,
  type Locale,
  type PageTree,
  pickLocalized,
} from '@sanad/contracts';
import {
  type EditContextValue,
  EditProvider,
  SectionBlock,
  WebsiteShell,
} from '@sanad/web-ui';
import { Monitor, PanelRight, Smartphone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaLibraryModal } from '../../../components/media-picker';
import { cn } from '../../../lib/cn';
import { useDirection } from '../../../providers/direction/use-direction';
import { useEditRecordNav } from '../hooks/use-edit-record-nav';
import { usePageInlineCommit } from '../hooks/use-inline-commit';
import { usePageMediaResolver } from '../hooks/use-section-media-resolver';
import { useStudioImagePicker } from '../hooks/use-studio-image-picker';

/** The DOM anchor a section wrapper carries so the rail can scroll the canvas to it. */
export function sectionAnchorId(sectionId: string): string {
  return `studio-section-${sectionId}`;
}

const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }) =>
  a.sortOrder - b.sortOrder;

/**
 * The preview-first Studio canvas (Phase 4b) — the WHOLE page rendered by the SHARED `@sanad/web-ui`
 * section components (the SAME the live site uses → preview === live), edited **in place**. For a
 * `content.manage` user the canvas runs in `mode='edit'` wrapped in one page-scope `EditProvider`, so
 * clicking any heading/paragraph/image edits it and commits on blur (`usePageInlineCommit` →
 * optimistic cache patch + `content.page.changed`); a read-only user gets `mode='preview'` (plain DOM,
 * no provider). A toolbar carries the locale + device toggles and the **Structure** button that opens
 * the slide-in rail. Each section sits in a transparent focus wrapper (outline only — no layout box)
 * so rail selection scrolls it into view and clicking it focuses it in the rail (bidirectional, U21).
 */
export function StudioCanvas({
  tree,
  canManage,
  focusedSectionId,
  onFocusSection,
  onOpenStructure,
}: {
  tree: PageTree;
  canManage: boolean;
  focusedSectionId: string | undefined;
  onFocusSection: (id: string) => void;
  onOpenStructure: () => void;
}) {
  const { t } = useTranslation('pages');
  const { locale: appLocale } = useDirection();
  const [previewLocale, setPreviewLocale] = useState<Locale>(appLocale);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const commit = usePageInlineCommit(tree.id, tree.sections);
  const resolveImageUrl = usePageMediaResolver(tree.sections);
  const imagePicker = useStudioImagePicker({
    onCommit: commit,
    locale: previewLocale,
  });
  const editRecord = useEditRecordNav();

  const sections = useMemo(
    () => [...tree.sections].sort(bySortOrder),
    [tree.sections],
  );

  // Scroll the canvas to the rail-selected section.
  useEffect(() => {
    if (!focusedSectionId) return;
    document
      .getElementById(sectionAnchorId(focusedSectionId))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusedSectionId]);

  const editContext: EditContextValue = {
    locale: previewLocale,
    onCommit: commit,
    onPickImage: imagePicker.onPickImage,
    onEditRecord: editRecord,
    editLabel: t('preview.edit'),
    pickImageLabel: t('preview.pickImage'),
    editRecordLabel: t('preview.editRecord'),
  };

  const pageTitle = pickLocalized(tree.title, previewLocale) || tree.slug;

  const body = sections.map((section) => (
    <div
      key={section.id}
      id={sectionAnchorId(section.id)}
      data-section-id={section.id}
      onClick={() => onFocusSection(section.id)}
      className={cn(
        'relative rounded-card outline-offset-4 transition-[outline-color]',
        section.id === focusedSectionId
          ? 'outline outline-2 outline-accent-line'
          : 'outline outline-2 outline-transparent',
      )}
    >
      <SectionBlock
        section={section}
        locale={previewLocale}
        mode={canManage ? 'edit' : 'preview'}
        resolveImageUrl={resolveImageUrl}
      />
    </div>
  ));

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-1.5 rounded-full bg-good shadow-glow"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-text">
            {t('preview.title')}
          </span>
          <span className="truncate text-xs text-faint">— {pageTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {canManage ? (
            <button
              type="button"
              onClick={onOpenStructure}
              className="inline-flex items-center gap-1.5 rounded-input border border-border bg-surface-2 px-2.5 py-1 text-xs text-dim hover:text-text"
            >
              <PanelRight className="size-3.5" aria-hidden="true" />
              {t('studio.structure')}
            </button>
          ) : null}
          <div className="flex rounded-input border border-border bg-surface-2 p-0.5">
            {LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setPreviewLocale(locale)}
                className={cn(
                  'rounded-xs px-2.5 py-1 text-xs',
                  previewLocale === locale
                    ? 'bg-surface text-text'
                    : 'text-dim hover:text-text',
                )}
              >
                {t(`preview.locale.${locale}`)}
              </button>
            ))}
          </div>
          <div className="flex rounded-input border border-border bg-surface-2 p-0.5">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              aria-label={t('preview.desktop')}
              className={cn(
                'grid size-7 place-items-center rounded-xs',
                device === 'desktop'
                  ? 'bg-surface text-text'
                  : 'text-dim hover:text-text',
              )}
            >
              <Monitor className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              aria-label={t('preview.mobile')}
              className={cn(
                'grid size-7 place-items-center rounded-xs',
                device === 'mobile'
                  ? 'bg-surface text-text'
                  : 'text-dim hover:text-text',
              )}
            >
              <Smartphone className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-bg p-5">
        <div
          className={cn(
            'mx-auto flex w-full flex-col gap-3 transition-[max-width] duration-300',
            device === 'mobile' ? 'max-w-mobile' : 'max-w-full',
          )}
        >
          <WebsiteShell locale={previewLocale} className="rounded-card p-4">
            {canManage ? (
              <EditProvider value={editContext}>{body}</EditProvider>
            ) : (
              body
            )}
          </WebsiteShell>
          <p className="text-center font-mono text-xs text-faint" dir="ltr">
            sanad.tech/{tree.slug}
          </p>
        </div>
      </div>

      {canManage ? <MediaLibraryModal {...imagePicker.dialog} /> : null}
    </div>
  );
}
