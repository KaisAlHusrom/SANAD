import * as Label from '@radix-ui/react-label';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useLogin } from '../hooks/use-login';

/** Presentation-only login form (logic lives in `useLogin`, U5). */
export function LoginForm() {
  const { t } = useTranslation('auth');
  const { form, onSubmit, isSubmitting } = useLogin();
  const { register, formState } = form;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label.Root htmlFor="email" className="text-sm text-dim">
          {t('email')}
        </Label.Root>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
        />
        {formState.errors.email ? (
          <p className="text-sm text-bad">{t('errors.emailInvalid')}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label.Root htmlFor="password" className="text-sm text-dim">
          {t('password')}
        </Label.Root>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {formState.errors.password ? (
          <p className="text-sm text-bad">{t('errors.passwordRequired')}</p>
        ) : null}
      </div>

      {formState.errors.root ? (
        <p className="text-sm text-bad" role="alert">
          {formState.errors.root.message}
        </p>
      ) : null}

      <Button type="submit" loading={isSubmitting}>
        {t('submit')}
      </Button>
    </form>
  );
}
