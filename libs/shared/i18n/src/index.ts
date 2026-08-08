// @sanad/i18n — the backend's Arabic-first message layer (U24): the ar/en catalogs, the
// single `translate()` renderer, locale propagation via `x-sanad-locale`, and the localized
// error factories every service throws. U10 barrel.
export * from './lib/catalog/index.js';
export * from './lib/locale/index.js';
export * from './lib/translate/index.js';
export * from './lib/errors/index.js';
