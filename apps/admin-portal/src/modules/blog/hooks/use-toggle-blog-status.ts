import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import { useUpdateBlogMutation } from '../api/blog.api';

/**
 * The inline draft↔published toggle handler (W6, U5): maps the Switch's boolean to the `status`
 * enum and PATCHes a partial `{ status }` body (the gateway stamps `publishedAt` on the first
 * publish). Toasts on failure; RTK tag invalidation reconciles the row. Permission gating is on
 * the Switch (disabled without `content.manage`).
 */
export function useToggleBlogStatus(): (
  id: string,
  published: boolean,
) => Promise<void> {
  const { t } = useTranslation('blog');
  const [updateBlog] = useUpdateBlogMutation();

  return async (id: string, published: boolean): Promise<void> => {
    try {
      await updateBlog({
        id,
        body: { status: published ? 'published' : 'draft' },
      }).unwrap();
    } catch {
      toast.error(t('errors.updateFailed'));
    }
  };
}
