import type { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { DialogBody, DialogFooter } from '../ui/dialog';
import { DynamicFormFields } from './dynamic-form-fields';
import type { DynamicFormProps } from './dynamic-form.types';
import { useDynamicForm } from './use-dynamic-form';

/**
 * The config-driven CRUD form (presentation; logic in `useDynamicForm`). Renders the shared
 * `DynamicFormFields` grid inside a scrollable DialogBody with Save/Cancel in a fixed footer.
 * Deeply-nested forms (branding) stay bespoke — this targets flat/standard entities.
 */
export function DynamicForm<TValues extends FieldValues>(
  props: DynamicFormProps<TValues>,
) {
  const { t } = useTranslation('uiKit');
  const { mode, submitLabel, cancelLabel, onCancel } = props;
  const { form, onSubmit, isSubmitting, visibleFields } = useDynamicForm(props);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <DialogBody>
        <DynamicFormFields form={form} fields={visibleFields} mode={mode} />
      </DialogBody>

      <DialogFooter>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel ?? t('form.cancel')}
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel ?? t('form.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
