import type { TestimonialItem } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useTestimonialForm } from '../hooks/use-testimonials-form';

/** The modal `type` this component serves in the global registry (create + edit). */
export const TESTIMONIAL_FORM_MODAL = 'content.testimonial.form';

/** Global-registry create/edit modal for a testimonial (W7). */
export function TestimonialFormModal({
  open,
  onClose,
  data,
}: ModalComponentProps) {
  const item = data.item as TestimonialItem | undefined;
  const { fields, schema, mode, record, submit, title, successMessage } =
    useTestimonialForm(item);

  return (
    <DynamicFormModal
      open={open}
      onClose={onClose}
      title={title}
      fields={fields}
      schema={schema}
      mode={mode}
      record={record}
      submit={submit}
      successMessage={successMessage}
    />
  );
}
