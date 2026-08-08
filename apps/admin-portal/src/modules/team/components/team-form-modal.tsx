import type { TeamMemberItem } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useTeamForm } from '../hooks/use-team-form';

/** The modal `type` this component serves in the global registry (create + edit). */
export const TEAM_FORM_MODAL = 'content.team-member.form';

/** Global-registry create/edit modal for a team member (W7). */
export function TeamFormModal({ open, onClose, data }: ModalComponentProps) {
  const item = data.item as TeamMemberItem | undefined;
  const { fields, schema, mode, record, submit, title, successMessage } =
    useTeamForm(item);

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
