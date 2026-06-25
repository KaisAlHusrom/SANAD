import { LOCALES, type Locale } from '@sanad/contracts';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { applyDirectionToDocument } from './seed-direction';

/**
 * Keeps the document's lang + direction in sync with the active locale (F12 seed
 * happens before mount; this maintains it on every `languageChanged`).
 */
export function DirectionProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const handle = (lng: string): void => {
      const locale: Locale = (LOCALES as readonly string[]).includes(lng)
        ? (lng as Locale)
        : 'ar';
      applyDirectionToDocument(locale);
    };
    i18n.on('languageChanged', handle);
    return () => {
      i18n.off('languageChanged', handle);
    };
  }, [i18n]);

  return <>{children}</>;
}
