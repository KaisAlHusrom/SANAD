import type { TeamMemberCreateRequest, TeamMemberItem } from '@sanad/contracts';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import { MediaIdPickerField } from '../../../components/media-picker';
import {
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
} from '../api/team.api';
import {
  TEAM_NULLABLE_KEYS,
  TEAM_TRANSLATABLE_KEYS,
  teamMemberFormSchema,
  type TeamMemberFormValues,
} from '../schema';

export interface UseTeamFormResult {
  fields: FieldConfig<TeamMemberFormValues>[];
  schema: typeof teamMemberFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: TeamMemberFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/** Builds the team-member create/edit form (U5) — fields, edit prefill, pivoting submit. */
export function useTeamForm(
  item: TeamMemberItem | undefined,
): UseTeamFormResult {
  const { t } = useTranslation('team');
  const [createTeamMember] = useCreateTeamMemberMutation();
  const [updateTeamMember] = useUpdateTeamMemberMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<TeamMemberFormValues>[]>(
    () => [
      {
        name: 'slug',
        type: 'slug',
        label: t('fields.slug'),
        colSpan: 2,
        slugSource: ['translations.en.name', 'translations.ar.name'],
      },
      { name: 'email', type: 'email', label: t('fields.email'), colSpan: 2 },
      {
        name: 'linkedinUrl',
        type: 'text',
        label: t('fields.linkedinUrl'),
        colSpan: 2,
      },
      {
        name: 'githubUrl',
        type: 'text',
        label: t('fields.githubUrl'),
        colSpan: 2,
      },
      {
        name: 'featured',
        type: 'toggle',
        label: t('fields.featured'),
        colSpan: 2,
      },
      {
        name: 'avatarMediaId',
        type: 'custom',
        label: t('fields.avatar'),
        colSpan: 4,
        render: ({ form, name }) => (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <MediaIdPickerField
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={field.onChange}
              />
            )}
          />
        ),
      },
      {
        name: 'name',
        type: 'text',
        label: t('fields.name'),
        translatable: true,
        colSpan: 2,
      },
      {
        name: 'role',
        type: 'text',
        label: t('fields.role'),
        translatable: true,
        colSpan: 2,
      },
      {
        name: 'bio',
        type: 'textarea',
        label: t('fields.bio'),
        translatable: true,
        colSpan: 4,
        rows: 5,
      },
    ],
    [t],
  );

  const record = useMemo(
    () =>
      item ? toLocalizedFormRecord(item, TEAM_TRANSLATABLE_KEYS) : undefined,
    [item],
  );

  const submit = async (values: TeamMemberFormValues): Promise<unknown> => {
    const body = toLocalizedUpsertBody<TeamMemberCreateRequest>(values, {
      translatableKeys: TEAM_TRANSLATABLE_KEYS,
      nullableKeys: TEAM_NULLABLE_KEYS,
    });
    return item
      ? updateTeamMember({ id: item.id, body }).unwrap()
      : createTeamMember(body).unwrap();
  };

  return {
    fields,
    schema: teamMemberFormSchema,
    mode,
    record,
    submit,
    title: item ? t('form.editTitle') : t('form.createTitle'),
    successMessage: item ? t('form.updated') : t('form.created'),
  };
}
