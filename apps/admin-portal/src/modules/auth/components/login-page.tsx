import { pickLocalized } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { useGetBrandingQuery } from '../../../data/branding/branding.api';
import { useDirection } from '../../../providers/direction';
import { useTheme } from '../../../providers/theme';
import { bundledLogoSrc } from '../../../shell/constants';
import { LoginForm } from './login-form';

/** Full-screen login (the documented chrome-less exception to F10). */
export function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const { locale } = useDirection();
  const { theme } = useTheme();
  const { data: branding } = useGetBrandingQuery();

  // Brand logo + name from the owner's visual-identity settings; fall back to bundled asset + i18n.
  const brandName = branding?.brand?.name
    ? pickLocalized(branding.brand.name, locale)
    : tc('app.name');
  const logoSrc = branding?.logoUrl ?? bundledLogoSrc(theme);

  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-6">
      <div className="flex w-full flex-col gap-6 rounded-hero border border-border bg-surface p-8 shadow-portal sm:w-96">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={logoSrc} alt={brandName} className="h-12 w-auto" />
          <h1 className="text-lg font-semibold text-text">{t('title')}</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
