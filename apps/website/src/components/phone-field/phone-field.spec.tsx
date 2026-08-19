import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneField } from './phone-field';
import { ar } from '../../i18n/dictionaries/ar';
import { en } from '../../i18n/dictionaries/en';

function setup(
  value = '',
  onChange = vi.fn<(next: string) => void>(),
  locale: 'ar' | 'en' = 'ar',
) {
  const dict = locale === 'ar' ? ar : en;
  render(
    <PhoneField
      id="lead-phone"
      locale={locale}
      label={dict.contact.phone}
      copy={dict.contact}
      value={value}
      onChange={onChange}
    />,
  );
  return { onChange, dict };
}

describe('PhoneField (P8.10.B1)', () => {
  it('starts on Saudi Arabia — the audience the forms are built for', () => {
    setup();
    expect(
      screen.getByRole('combobox', { name: ar.contact.phoneCountry }),
    ).toHaveTextContent('+966');
  });

  it('emits a normalized E.164 number as the visitor types the national part', async () => {
    const { onChange } = setup();
    await userEvent.type(screen.getByLabelText(ar.contact.phone), '501234567');
    expect(onChange).toHaveBeenLastCalledWith('+966501234567');
  });

  it('accepts the leading trunk zero people actually write', async () => {
    const { onChange } = setup();
    await userEvent.type(screen.getByLabelText(ar.contact.phone), '0501234567');
    expect(onChange).toHaveBeenLastCalledWith('+966501234567');
  });

  it('follows a pasted international number to its own country', async () => {
    const { onChange } = setup();
    await userEvent.type(
      screen.getByLabelText(ar.contact.phone),
      '+971501234567',
    );
    expect(onChange).toHaveBeenLastCalledWith('+971501234567');
    expect(
      screen.getByRole('combobox', { name: ar.contact.phoneCountry }),
    ).toHaveTextContent('+971');
  });

  it('recomposes the number when the visitor changes country', async () => {
    const onChange = vi.fn<(next: string) => void>();
    setup('+966501234567', onChange);
    await userEvent.click(
      screen.getByRole('combobox', { name: ar.contact.phoneCountry }),
    );
    await userEvent.type(
      screen.getByLabelText(ar.contact.phoneCountrySearch),
      '971',
    );
    await userEvent.click(await screen.findByRole('option', { name: /\+971/ }));
    expect(onChange).toHaveBeenLastCalledWith('+971501234567');
  });

  it('opens ON the current country, not the alphabetical first of 245', async () => {
    setup('+971501234567');
    await userEvent.click(
      screen.getByRole('combobox', { name: ar.contact.phoneCountry }),
    );
    const search = await screen.findByLabelText(ar.contact.phoneCountrySearch);
    const activeId = search.getAttribute('aria-activedescendant');
    expect(activeId).toBe('lead-phone-countries-AE');
    expect(document.getElementById(activeId ?? '')).toHaveClass(
      'lead-phone__option--active',
    );
  });

  it('names countries in the reader’s own language', async () => {
    setup('', vi.fn(), 'ar');
    await userEvent.click(
      screen.getByRole('combobox', { name: ar.contact.phoneCountry }),
    );
    expect(
      await screen.findByRole('option', { name: /السعودية|المملكة العربية/ }),
    ).toBeInTheDocument();
  });

  it('reads and types country names in the page direction, while the number stays LTR (U7)', async () => {
    setup('', vi.fn(), 'ar');
    // The number and its dial-code trigger are LTR in every locale — a phone number is.
    expect(
      screen.getByLabelText(ar.contact.phone).closest('.lead-phone'),
    ).toHaveAttribute('dir', 'ltr');
    await userEvent.click(
      screen.getByRole('combobox', { name: ar.contact.phoneCountry }),
    );
    // …but the menu is Arabic PROSE the visitor types into, so it takes RTL back.
    const search = screen.getByLabelText(ar.contact.phoneCountrySearch);
    expect(search.closest('[dir]')).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('listbox').closest('[dir]')).toHaveAttribute(
      'dir',
      'rtl',
    );
    // An Arabic query must actually find its country.
    await userEvent.type(search, 'السعود');
    expect(await screen.findByRole('option', { name: /\+966/ })).toBeVisible();
  });

  it('keeps the English menu LTR', async () => {
    setup('', vi.fn(), 'en');
    await userEvent.click(
      screen.getByRole('combobox', { name: en.contact.phoneCountry }),
    );
    expect(
      screen.getByLabelText(en.contact.phoneCountrySearch).closest('[dir]'),
    ).toHaveAttribute('dir', 'ltr');
  });

  it('searches by country name, ISO code and dial code', async () => {
    setup();
    await userEvent.click(
      screen.getByRole('combobox', { name: ar.contact.phoneCountry }),
    );
    const search = screen.getByLabelText(ar.contact.phoneCountrySearch);
    await userEvent.type(search, 'EG');
    expect(await screen.findByRole('option', { name: /\+20/ })).toBeVisible();
    await userEvent.clear(search);
    // +44 is shared by the UK and the crown dependencies — every match is a real one.
    await userEvent.type(search, '+44');
    const byDialCode = await screen.findAllByRole('option', { name: /\+44/ });
    expect(byDialCode.length).toBeGreaterThan(0);
  });

  it('tells the visitor when a search matches nothing (U23)', async () => {
    setup();
    await userEvent.click(
      screen.getByRole('combobox', { name: ar.contact.phoneCountry }),
    );
    await userEvent.type(
      screen.getByLabelText(ar.contact.phoneCountrySearch),
      'zzzzzz',
    );
    expect(
      await screen.findByText(ar.contact.phoneNoCountry),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    setup();
    const trigger = screen.getByRole('combobox', {
      name: ar.contact.phoneCountry,
    });
    await userEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it('is operable from the keyboard alone', async () => {
    const onChange = vi.fn<(next: string) => void>();
    setup('+966501234567', onChange);
    const trigger = screen.getByRole('combobox', {
      name: ar.contact.phoneCountry,
    });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );
  });

  it('renders the number LTR in both locales, and shows the error it is given', () => {
    render(
      <PhoneField
        id="lead-phone"
        locale="ar"
        label={ar.contact.phone}
        copy={ar.contact}
        value=""
        onChange={vi.fn()}
        error={ar.contact.invalidPhone}
      />,
    );
    expect(screen.getByText(ar.contact.invalidPhone)).toBeInTheDocument();
    expect(screen.getByLabelText(ar.contact.phone)).toHaveAttribute(
      'dir',
      'ltr',
    );
    expect(screen.getByLabelText(ar.contact.phone)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('adopts an external reset back to empty (the post-success reset)', async () => {
    const { rerender } = render(
      <PhoneField
        id="lead-phone"
        locale="ar"
        label={ar.contact.phone}
        copy={ar.contact}
        value="+966501234567"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(ar.contact.phone)).toHaveValue('501234567');
    rerender(
      <PhoneField
        id="lead-phone"
        locale="ar"
        label={ar.contact.phone}
        copy={ar.contact}
        value=""
        onChange={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(screen.getByLabelText(ar.contact.phone)).toHaveValue(''),
    );
  });

  it('cannot be operated while the form is submitting', () => {
    render(
      <PhoneField
        id="lead-phone"
        locale="ar"
        label={ar.contact.phone}
        copy={ar.contact}
        value=""
        onChange={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByLabelText(ar.contact.phone)).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: ar.contact.phoneCountry }),
    ).toBeDisabled();
  });
});
