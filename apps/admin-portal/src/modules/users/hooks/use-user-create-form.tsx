import {
  STAFF_ROLES,
  type Role,
  type UserCreateRequest,
} from '@sanad/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import { useCreateUserMutation } from '../api/users.api';
import { userCreateFormSchema, type UserCreateFormValues } from '../schema';

export interface UseUserCreateFormResult {
  fields: FieldConfig<UserCreateFormValues>[];
  schema: typeof userCreateFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: UserCreateFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * Builds the create-user form (U5): name/email/password(+generate)/active toggle + a staff
 * roles multi-select (labels localized via i18n, U8). Submit pivots to the contract body
 * (roles narrowed to the `Role` union) and calls the create mutation.
 */
export function useUserCreateForm(): UseUserCreateFormResult {
  const { t } = useTranslation('users');
  const [createUser] = useCreateUserMutation();

  const fields = useMemo<FieldConfig<UserCreateFormValues>[]>(
    () => [
      { name: 'name', type: 'text', label: t('fields.name'), colSpan: 2 },
      { name: 'email', type: 'email', label: t('fields.email'), colSpan: 2 },
      {
        name: 'password',
        type: 'password',
        label: t('fields.password'),
        generate: true,
        colSpan: 2,
      },
      {
        name: 'isActive',
        type: 'toggle',
        label: t('fields.isActive'),
        colSpan: 2,
        defaultValue: true,
      },
      {
        name: 'roles',
        type: 'multi-select',
        label: t('fields.roles'),
        colSpan: 4,
        defaultValue: [],
        options: STAFF_ROLES.map((role) => ({
          value: role,
          label: t(`roles.${role}`),
        })),
      },
    ],
    [t],
  );

  const submit = async (values: UserCreateFormValues): Promise<unknown> => {
    const roles = values.roles.filter((role): role is Role =>
      (STAFF_ROLES as readonly string[]).includes(role),
    );
    const body: UserCreateRequest = {
      name: values.name,
      email: values.email,
      password: values.password,
      isActive: values.isActive,
      roles,
    };
    return createUser(body).unwrap();
  };

  return {
    fields,
    schema: userCreateFormSchema,
    mode: 'create',
    record: undefined,
    submit,
    title: t('form.createTitle'),
    successMessage: t('form.created'),
  };
}
