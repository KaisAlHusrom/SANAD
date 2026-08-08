import { ALL_ROLES, type AuthUser } from '@sanad/contracts';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import type { ModalComponentProps } from '../../../data/modal/modal-registry';
import { cn } from '../../../lib/cn';
import { useUserRoles } from '../hooks/use-user-roles';

/** The modal `type` this component serves in the global registry (role assignment). */
export const USER_ROLES_MODAL = 'identity.user.roles';

/** The role chips editor — toggling a chip assigns/revokes that role for the user. */
function RolesEditor({
  user,
  onClose,
}: {
  user: AuthUser;
  onClose: () => void;
}) {
  const { t } = useTranslation('users');
  const { t: tc } = useTranslation('common');
  const { roles, isPending, toggle } = useUserRoles(user);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-text">
          {t('roles.title', { name: user.name })}
        </DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p className="mb-4 text-sm text-dim">{t('roles.hint')}</p>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => {
            const active = roles.has(role);
            return (
              <button
                key={role}
                type="button"
                disabled={isPending}
                aria-pressed={active}
                onClick={() => void toggle(role)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm transition-colors disabled:opacity-50',
                  active
                    ? 'border-accent-line bg-accent-soft text-accent'
                    : 'border-border-2 text-dim hover:bg-surface-2',
                )}
              >
                {active ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : null}
                {t(`roles.${role}`)}
              </button>
            );
          })}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {tc('actions.close')}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Global-registry role-assignment modal (W7). Opens with `{ user }`; toggling a role chip
 * calls the assign/revoke mutation and reconciles from the returned user.
 */
export function UserRolesModal({ open, onClose, data }: ModalComponentProps) {
  const user = data.user as AuthUser | undefined;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent size="md">
        {user ? <RolesEditor user={user} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
