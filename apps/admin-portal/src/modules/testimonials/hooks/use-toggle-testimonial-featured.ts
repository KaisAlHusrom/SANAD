import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import { useUpdateTestimonialMutation } from '../api/testimonials.api';

/**
 * The inline `featured` toggle handler (W6, U5): PATCHes a partial `{ featured }` body and
 * toasts on failure. RTK tag invalidation reconciles the row; permission gating is on the
 * Switch (disabled without `content.manage`).
 */
export function useToggleTestimonialFeatured(): (
  id: string,
  featured: boolean,
) => Promise<void> {
  const { t } = useTranslation('testimonials');
  const [updateTestimonial] = useUpdateTestimonialMutation();

  return async (id: string, featured: boolean): Promise<void> => {
    try {
      await updateTestimonial({ id, body: { featured } }).unwrap();
    } catch {
      toast.error(t('errors.updateFailed'));
    }
  };
}
