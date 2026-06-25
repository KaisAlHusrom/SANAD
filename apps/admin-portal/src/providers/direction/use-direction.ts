import {
  directionForLocale,
  LOCALES,
  type Direction,
  type Locale,
} from '@sanad/contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { writeLocale } from '../../i18n/locale.storage';
import { applyDirectionToDocument } from './seed-direction';

interface UseDirectionResult {
  locale: Locale;
  direction: Direction;
  setLocale: (locale: Locale) => void;
}

function toLocale(value: string): Locale {
  return (LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : 'ar';
}

/** Read the active locale/direction and switch it (persists + updates the document). */
export function useDirection(): UseDirectionResult {
  const { i18n } = useTranslation();
  const locale = toLocale(i18n.language);

  const setLocale = useCallback(
    (next: Locale) => {
      writeLocale(next);
      void i18n.changeLanguage(next);
      applyDirectionToDocument(next);
    },
    [i18n],
  );

  return { locale, direction: directionForLocale(locale), setLocale };
}
