import type { BlogPostItem } from '@sanad/contracts';
import { ArrowLeft } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DynamicFormFields,
  useDynamicForm,
} from '../../../components/dynamic-form';
import { EmptyState } from '../../../components/feedback/empty-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { RenderGate } from '../../../components/feedback/render-gate';
import { Skeleton } from '../../../components/feedback/skeleton';
import { Button } from '../../../components/ui/button';
import { useUnsavedGuard } from '../../../hooks/use-unsaved-guard';
import { useGetBlogPostQuery } from '../api/blog.api';
import { useBlogForm } from '../hooks/use-blog-form';
import { usePostDraft } from '../hooks/use-post-draft';
import type { BlogPostFormValues } from '../schema';

const POSTS_PATH = '/content/blog';

/**
 * The dedicated blog-post editor (U21) — replaces the shared modal so a tall post form lives on
 * its own page and is never lost by a mis-click. Reuses `useBlogForm` (fields/schema/submit) and
 * the shared `DynamicFormFields`; adds an unsaved-changes guard + local draft autosave. Mounted
 * per post via a `key` so the form/draft state is fresh between create and each edit.
 */
function BlogFormEditor({ item }: { item: BlogPostItem | undefined }) {
  const { t } = useTranslation('blog');
  const navigate = useNavigate();
  const { fields, schema, mode, record, submit, title } = useBlogForm(item);
  const successMessage = item ? t('form.updated') : t('form.created');

  // onSuccess needs the draft cleaner (declared below) — bridge via a ref to keep hook order.
  const clearDraftRef = useRef<() => void>(() => undefined);
  const { form, onSubmit, isSubmitting, visibleFields } =
    useDynamicForm<BlogPostFormValues>({
      fields,
      schema,
      mode,
      record,
      submit,
      successMessage,
      onSuccess: () => {
        clearDraftRef.current();
        navigate(POSTS_PATH);
      },
    });

  const draftKey = `blog-draft:${item?.id ?? 'new'}`;
  const draft = usePostDraft(draftKey, form);
  clearDraftRef.current = draft.clearDraft;

  useUnsavedGuard(form.formState.isDirty && !isSubmitting, {
    title: t('form.unsavedTitle'),
    message: t('form.unsavedBody'),
    variant: 'warning',
    confirmLabel: t('form.discard'),
    cancelLabel: t('form.keepEditing'),
  });

  return (
    <section className="flex flex-col gap-6 pb-10">
      <header className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-4 border-b border-border bg-veil px-1 py-4 backdrop-blur">
        <div className="flex flex-col gap-1">
          <Link
            to={POSTS_PATH}
            className="inline-flex w-fit items-center gap-1 text-sm text-dim hover:text-text"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            {t('actions.backToPosts')}
          </Link>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(POSTS_PATH)}
          >
            {t('form.cancel')}
          </Button>
          <Button
            type="button"
            loading={isSubmitting}
            onClick={() => void onSubmit()}
          >
            {t('form.save')}
          </Button>
        </div>
      </header>

      {draft.draftAvailable ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-2 bg-surface-2 px-4 py-3">
          <p className="text-sm text-text">{t('form.draftFound')}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={draft.discardDraft}>
              {t('form.discardDraft')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={draft.restoreDraft}
            >
              {t('form.restoreDraft')}
            </Button>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate>
        <DynamicFormFields form={form} fields={visibleFields} mode={mode} />
      </form>
    </section>
  );
}

/**
 * Route entry for the post editor. `/content/blog/new` → create; `/content/blog/:id/edit` →
 * fetches the post (drafts visible via the admin `manage/:id` route) then renders the editor.
 * The fetch goes through the F2 states (skeleton → error → not-found → editor).
 */
export function BlogFormPage() {
  const { t } = useTranslation('blog');
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <BlogFormEditor item={undefined} />;
  }

  return <BlogFormEditPage id={id} notFoundLabel={t('form.notFound')} />;
}

function BlogFormEditPage({
  id,
  notFoundLabel,
}: {
  id: string;
  notFoundLabel: string;
}) {
  const { data, isLoading, isError, error } = useGetBlogPostQuery(id);
  const message =
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : notFoundLabel;

  return (
    <RenderGate
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      skeleton={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-72 w-full" />
        </div>
      }
      error={<ErrorState message={message} />}
      empty={<EmptyState title={notFoundLabel} />}
    >
      <BlogFormEditor key={data?.id} item={data} />
    </RenderGate>
  );
}
