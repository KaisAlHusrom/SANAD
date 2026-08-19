'use client';

import { directionForLocale, type Locale } from '@sanad/contracts';
import { usePhoneField } from './use-phone-field';

/** The strings the field needs — a slice of the site dictionary's `contact` group (U8). */
export interface PhoneFieldCopy {
  phoneCountry: string;
  phoneCountrySearch: string;
  phoneNoCountry: string;
  phonePlaceholder: string;
  phoneHint: string;
}

export interface PhoneFieldProps {
  id: string;
  locale: Locale;
  label: string;
  copy: PhoneFieldCopy;
  /** E.164, or `''`. Owned by the form (RHF); this field never holds the truth. */
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  error?: string | null;
  disabled?: boolean;
}

/**
 * The lead forms' phone field: a searchable dial-code picker beside the national number
 * (P8.10.B1). The number itself is LTR in **both** locales (WEB6) while the label, hint and
 * error follow the page; validity is decided by the shared `phoneSchema`, never here (U3).
 */
export function PhoneField({
  id,
  locale,
  label,
  copy,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
}: PhoneFieldProps) {
  const field = usePhoneField({ locale, value, onChange });
  const listId = `${id}-countries`;

  return (
    <div className="lead-field" ref={field.rootRef}>
      <label className="lead-label" htmlFor={id}>
        {label}
      </label>

      <div className="lead-phone" dir="ltr">
        <button
          type="button"
          ref={field.triggerRef}
          className="lead-phone__country"
          role="combobox"
          aria-label={copy.phoneCountry}
          aria-expanded={field.open}
          aria-controls={field.open ? listId : undefined}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={field.toggle}
          onKeyDown={field.onTriggerKeyDown}
        >
          <span aria-hidden="true">{field.selected?.flag}</span>
          <span>+{field.selected?.callingCode}</span>
          <span className="lead-phone__caret" aria-hidden="true" />
        </button>

        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          className="lead-input lead-phone__number"
          placeholder={copy.phonePlaceholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${id}-hint`}
          disabled={disabled}
          value={field.national}
          onChange={(event) => field.changeNational(event.target.value)}
          onBlur={onBlur}
        />

        {/* The popover BOX stays in the group's LTR flow so `inset-inline-start` still anchors it
            under the trigger; its CONTENT — country names the reader types and reads in their own
            language — takes the page direction back (U7). */}
        {field.open ? (
          <div className="lead-phone__popover" onKeyDown={field.onListKeyDown}>
            <div className="lead-phone__panel" dir={directionForLocale(locale)}>
              <input
                ref={field.searchRef}
                type="search"
                className="lead-input lead-phone__search"
                aria-label={copy.phoneCountrySearch}
                aria-controls={listId}
                aria-activedescendant={
                  field.results[field.activeIndex]
                    ? `${listId}-${field.results[field.activeIndex]?.code}`
                    : undefined
                }
                placeholder={copy.phoneCountrySearch}
                value={field.search}
                onChange={(event) => {
                  field.setSearch(event.target.value);
                  field.setActiveIndex(0);
                }}
              />
              {field.results.length === 0 ? (
                <p className="lead-phone__empty">{copy.phoneNoCountry}</p>
              ) : (
                <ul
                  className="lead-phone__list"
                  role="listbox"
                  id={listId}
                  ref={field.listRef}
                >
                  {field.results.map((option, index) => (
                    <li key={option.code}>
                      <button
                        type="button"
                        role="option"
                        id={`${listId}-${option.code}`}
                        aria-selected={option.code === field.selected?.code}
                        className={
                          index === field.activeIndex
                            ? 'lead-phone__option lead-phone__option--active'
                            : 'lead-phone__option'
                        }
                        onMouseEnter={() => field.setActiveIndex(index)}
                        onClick={() => field.selectCountry(option.code)}
                      >
                        <span aria-hidden="true">{option.flag}</span>
                        <span className="lead-phone__name">{option.name}</span>
                        {/* A dial code is a number — LTR even inside the RTL menu. */}
                        <span className="lead-phone__dial" dir="ltr">
                          +{option.callingCode}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <span className="lead-hint" id={`${id}-hint`}>
        {copy.phoneHint}
      </span>
      {error ? <span className="lead-error">{error}</span> : null}
    </div>
  );
}
