import type { EditableCollection } from '@sanad/web-ui';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Map a collection record to its editor route. Blog has a routable editor (`/content/blog/:id/edit`);
 * portfolio + testimonials open an in-page modal, deep-linked via `?edit=<id>` (read by their list
 * pages). Services / faq / team have no per-record deep-link (managed inline in their list) → their
 * list page (faq lives at the plural `/content/faqs` route).
 */
export function editRecordPath(
  collection: EditableCollection,
  id: string,
): string {
  switch (collection) {
    case 'blog':
      return `/content/blog/${id}/edit`;
    case 'portfolio':
      return `/content/portfolio?edit=${id}`;
    case 'testimonials':
      return `/content/testimonials?edit=${id}`;
    case 'services':
      return '/content/services';
    case 'faq':
      return '/content/faqs';
    case 'team':
      return '/content/team';
  }
}

/**
 * The Content Studio's collection-cover deep-link (U5): `EditContext.onEditRecord` calls this to jump
 * from a work/testimonial/blog cover in the preview straight to that record's editor. Route-owning
 * concern kept in the admin (the `@sanad/web-ui` lib stays route-free).
 */
export function useEditRecordNav(): (
  collection: EditableCollection,
  id: string,
) => void {
  const navigate = useNavigate();
  return useCallback(
    (collection: EditableCollection, id: string) => {
      navigate(editRecordPath(collection, id));
    },
    [navigate],
  );
}
