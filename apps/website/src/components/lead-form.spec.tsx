import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LeadCreateRequest } from '@sanad/contracts';
import { LeadForm } from './lead-form';
import { ar } from '../i18n/dictionaries/ar';

function setup(onSubmit: (v: LeadCreateRequest) => Promise<void>) {
  return render(<LeadForm locale="ar" dict={ar} onSubmit={onSubmit} />);
}

describe('LeadForm (F6)', () => {
  it('blocks submit and shows required errors when empty', async () => {
    const onSubmit = vi.fn(async () => undefined);
    setup(onSubmit);
    await userEvent.click(
      screen.getByRole('button', { name: ar.contact.submit }),
    );
    await waitFor(() => {
      expect(screen.getAllByText(ar.contact.required).length).toBeGreaterThan(
        0,
      );
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    const onSubmit = vi.fn(async () => undefined);
    setup(onSubmit);
    await userEvent.type(screen.getByLabelText(ar.contact.name), 'سارة');
    await userEvent.type(
      screen.getByLabelText(ar.contact.email),
      'not-an-email',
    );
    await userEvent.type(screen.getByLabelText(ar.contact.message), 'مرحبا');
    await userEvent.click(
      screen.getByRole('button', { name: ar.contact.submit }),
    );
    await waitFor(() => {
      expect(screen.getByText(ar.contact.invalidEmail)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid lead with source + locale, then shows success', async () => {
    const onSubmit = vi.fn(async (_v: LeadCreateRequest) => undefined);
    setup(onSubmit);
    await userEvent.type(screen.getByLabelText(ar.contact.name), 'سارة');
    await userEvent.type(
      screen.getByLabelText(ar.contact.email),
      'sara@example.com',
    );
    await userEvent.type(
      screen.getByLabelText(ar.contact.message),
      'أريد بناء منصة',
    );
    await userEvent.click(
      screen.getByRole('button', { name: ar.contact.submit }),
    );
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      name: 'سارة',
      email: 'sara@example.com',
      message: 'أريد بناء منصة',
      source: 'contact',
      locale: 'ar',
    });
    expect(await screen.findByText(ar.contact.success)).toBeInTheDocument();
  });

  it('shows an error alert when the submission fails', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('boom');
    });
    setup(onSubmit);
    await userEvent.type(screen.getByLabelText(ar.contact.name), 'سارة');
    await userEvent.type(
      screen.getByLabelText(ar.contact.email),
      'sara@example.com',
    );
    await userEvent.type(screen.getByLabelText(ar.contact.message), 'مرحبا');
    await userEvent.click(
      screen.getByRole('button', { name: ar.contact.submit }),
    );
    expect(await screen.findByText(ar.contact.error)).toBeInTheDocument();
  });
});
