import type { AuthUser } from '@sanad/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import { useUpdateUserMutation } from '../api/users.api';
import { userEditFormSchema, type UserEditFormValues } from '../schema';

export interface UseUserEditFormResult {
  fields: FieldConfig<UserEditFormValues>[];
  schema: typeof userEditFormSchema;
  mode: FormMode;
  record: Record<string, unknown>;
  submit: (values: UserEditFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * Builds the edit-user form (U5): profile fields only (name, email, active). Roles are
 * managed in the dedicated roles modal; password reset is out of scope (P7.D). Prefills from
 * the row and submits the profile patch.
 */
export function useUserEditForm(user: AuthUser): UseUserEditFormResult {
  const { t } = useTranslation('users');
  const [updateUser] = useUpdateUserMutation();

  const fields = useMemo<FieldConfig<UserEditFormValues>[]>(
    () => [
      { name: 'name', type: 'text', label: t('fields.name'), colSpan: 2 },
      { name: 'email', type: 'email', label: t('fields.email'), colSpan: 2 },
      {
        name: 'isActive',
        type: 'toggle',
        label: t('fields.isActive'),
        colSpan: 4,
      },
    ],
    [t],
  );

  const record = useMemo(
    () => ({ name: user.name, email: user.email, isActive: user.isActive }),
    [user],
  );

  const submit = (values: UserEditFormValues): Promise<unknown> =>
    updateUser({ id: user.id, body: values }).unwrap();

  return {
    fields,
    schema: userEditFormSchema,
    mode: 'edit',
    record,
    submit,
    title: t('form.editTitle'),
    successMessage: t('form.updated'),
  };
}
