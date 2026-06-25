import { useTranslation } from 'react-i18next';
import { LoginForm } from './login-form';

/** Full-screen login (the documented chrome-less exception to F10). */
export function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');

  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-6">
      <div className="flex w-full flex-col gap-6 rounded-hero border border-border bg-surface p-8 sm:w-96">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="/admin/brand/logo-dark.png"
            alt={tc('app.name')}
            className="h-12 w-auto"
          />
          <h1 className="text-lg font-semibold text-text">{t('title')}</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
