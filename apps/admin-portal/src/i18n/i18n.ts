import { DEFAULT_LOCALE, LOCALES } from '@sanad/contracts';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readLocaleFromStorage } from './locale.storage';

// Seed the active language synchronously from storage at module load (F12); ar is the
// default (U8). Per-module catalogs register themselves at import (registerCatalog).
const initialLocale = readLocaleFromStorage() ?? DEFAULT_LOCALE;

void i18next.use(initReactI18next).init({
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...LOCALES],
  defaultNS: 'common',
  ns: ['common'],
  resources: {},
  interpolation: { escapeValue: false },
  returnNull: false,
});

export const i18n = i18next;
