import type { AuthUser } from '@sanad/contracts';
import { DynamicFormModal } from '../../../components/dynamic-form';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { useUserCreateForm } from '../hooks/use-user-create-form';
import { useUserEditForm } from '../hooks/use-user-edit-form';

/** The modal `type` this component serves in the global registry (create + edit). */
export const USER_FORM_MODAL = 'identity.user.form';

/** Create form — invites a new user with roles + a generated password. */
function CreateUserForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { fields, schema, mode, record, submit, title, successMessage } =
    useUserCreateForm();
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

/** Edit form — profile fields only (roles live in the roles modal). */
function EditUserForm({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: AuthUser;
}) {
  const { fields, schema, mode, record, submit, title, successMessage } =
    useUserEditForm(user);
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

/**
 * Global-registry create/edit user modal (W7). Opens with `{ user }` for edit (profile
 * prefill) or no data for create. Create and edit use distinct schemas/fields, so each
 * branch is its own component (hooks stay unconditional).
 */
export function UserFormModal({ open, onClose, data }: ModalComponentProps) {
  const user = data.user as AuthUser | undefined;
  return user ? (
    <EditUserForm open={open} onClose={onClose} user={user} />
  ) : (
    <CreateUserForm open={open} onClose={onClose} />
  );
}
