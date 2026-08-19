'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import {
  DEFAULT_PHONE_COUNTRY,
  parsePhone,
  type Locale,
  type PhoneCountry,
} from '@sanad/contracts';

/** One row of the dial-code list. */
export interface PhoneCountryOption {
  code: PhoneCountry;
  /** The country's name in the reader's own language. */
  name: string;
  callingCode: string;
  flag: string;
}

const REGIONAL_INDICATOR_OFFSET = 0x1f1a5;

/** `SA` → 🇸🇦, straight from the code — no flag asset, no dataset to maintain. */
function flagOf(code: string): string {
  return String.fromCodePoint(
    ...[...code].map(
      (letter) => letter.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET,
    ),
  );
}

// F8: `Intl.DisplayNames` is expensive to construct — one per locale, cached for the session.
const regionNames = new Map<Locale, Intl.DisplayNames>();

function regionNamesFor(locale: Locale): Intl.DisplayNames {
  const cached = regionNames.get(locale);
  if (cached) {
    return cached;
  }
  const created = new Intl.DisplayNames([locale], { type: 'region' });
  regionNames.set(locale, created);
  return created;
}

// The country list is the same for every field; only the labels are per-locale.
const optionsByLocale = new Map<Locale, readonly PhoneCountryOption[]>();

function countryOptions(locale: Locale): readonly PhoneCountryOption[] {
  const cached = optionsByLocale.get(locale);
  if (cached) {
    return cached;
  }
  const names = regionNamesFor(locale);
  const built = getCountries()
    .map((code) => ({
      code,
      name: names.of(code) ?? code,
      callingCode: getCountryCallingCode(code),
      flag: flagOf(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  optionsByLocale.set(locale, built);
  return built;
}

/** Digits plus at most one leading `+` — everything a phone number can legitimately contain. */
function sanitize(text: string): string {
  const kept = text.replace(/[^\d+]/g, '');
  return kept.startsWith('+')
    ? `+${kept.slice(1).replace(/\+/g, '')}`
    : kept.replace(/\+/g, '');
}

/**
 * What the field publishes upward. A number that does not validate yet is still published in
 * its composed form so the shared `phoneSchema` — not this component — decides it is wrong,
 * and the visitor sees one message from one rule (U3).
 */
function compose(country: PhoneCountry, national: string): string {
  if (national === '') {
    return '';
  }
  const parsed = parsePhone(national, country);
  if (parsed) {
    return parsed.e164;
  }
  return national.startsWith('+')
    ? national
    : `+${getCountryCallingCode(country)}${national.replace(/^0+/, '')}`;
}

export function usePhoneField({
  locale,
  value,
  onChange,
}: {
  locale: Locale;
  value: string;
  onChange: (next: string) => void;
}) {
  const initial = parsePhone(value);
  const [country, setCountry] = useState<PhoneCountry>(
    initial?.country ?? DEFAULT_PHONE_COUNTRY,
  );
  const [national, setNational] = useState(initial?.nationalNumber ?? '');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Adopt a value the field did not produce — a prefill, or the reset after a successful
  // submit. Comparing against what we WOULD publish keeps this from fighting the user's typing.
  const published = compose(country, national);
  useEffect(() => {
    if (value === published) {
      return;
    }
    const parsed = parsePhone(value);
    setCountry(parsed?.country ?? DEFAULT_PHONE_COUNTRY);
    setNational(parsed?.nationalNumber ?? '');
    // Deliberately keyed on `value` alone: `published` is derived from the state this effect
    // sets, so depending on it would loop.
  }, [value]);

  const options = countryOptions(locale);
  const results = useMemo(() => {
    const needle = search.trim().replace(/^\+/, '').toLocaleLowerCase(locale);
    if (needle === '') {
      return options;
    }
    return options.filter(
      (option) =>
        option.name.toLocaleLowerCase(locale).includes(needle) ||
        option.code.toLowerCase().includes(needle) ||
        option.callingCode.includes(needle),
    );
  }, [locale, options, search]);

  const selected =
    options.find((option) => option.code === country) ?? options[0];

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    setSearch('');
    setActiveIndex(0);
    if (refocus) {
      triggerRef.current?.focus();
    }
  }, []);

  // Open ON the country the field is already set to — 245 countries sorted by name means the
  // alphabetical first is never the one the visitor is looking at.
  const openList = useCallback(() => {
    const index = options.findIndex((option) => option.code === country);
    setActiveIndex(index < 0 ? 0 : index);
    setOpen(true);
  }, [country, options]);

  const selectCountry = useCallback(
    (code: PhoneCountry) => {
      setCountry(code);
      onChange(compose(code, national));
      close(true);
    },
    [close, national, onChange],
  );

  const changeNational = useCallback(
    (text: string) => {
      const cleaned = sanitize(text);
      setNational(cleaned);
      const detected = parsePhone(cleaned, country)?.country;
      if (detected && detected !== country) {
        setCountry(detected);
      }
      onChange(compose(detected ?? country, cleaned));
    },
    [country, onChange],
  );

  // Clicking anywhere else dismisses the list — the site has no overlay layer to catch it.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [close, open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    }
  }, [open]);

  // Keep the highlighted row in view, whether it was reached by opening or by arrow keys.
  useEffect(() => {
    if (!open) {
      return;
    }
    // `scrollIntoView` is not implemented in jsdom — optional-call so the specs stay real.
    listRef.current?.children[activeIndex]?.scrollIntoView?.({
      block: 'nearest',
    });
  }, [activeIndex, open]);

  const onListKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (results.length === 0) {
          return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex(
          (current) => (current + step + results.length) % results.length,
        );
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const option = results[activeIndex];
        if (option) {
          selectCountry(option.code);
        }
      }
    },
    [activeIndex, close, results, selectCountry],
  );

  const onTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        openList();
      }
    },
    [openList],
  );

  return {
    activeIndex,
    changeNational,
    national,
    listRef,
    onListKeyDown,
    onTriggerKeyDown,
    open,
    results,
    rootRef,
    search,
    searchRef,
    selectCountry,
    selected,
    setActiveIndex,
    setSearch,
    toggle: () => (open ? close(true) : openList()),
    triggerRef,
  };
}
