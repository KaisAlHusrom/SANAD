import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LeadCreateRequest } from '@sanad/contracts';
import { RequestForm } from './request-form';
import { REQUEST_COPY } from './request-copy';
import { BUDGET_BANDS, PROJECT_TYPES } from './request.constants';
import { ar } from '../../../i18n/dictionaries/ar';

const TYPE = PROJECT_TYPES[0]; // { value: 'SaaS platform', label:{ ar:'منصّة SaaS' } }
const BUDGET = BUDGET_BANDS[1]; // '15,000–50,000 SAR'
if (!TYPE || !BUDGET) throw new Error('request form fixtures missing');

function setup(onSubmit: (v: LeadCreateRequest) => Promise<void>) {
  return render(<RequestForm locale="ar" dict={ar} onSubmit={onSubmit} />);
}

/** Advance step 1 → 2 by choosing a type + Next. */
async function toBrief() {
  await userEvent.click(screen.getByRole('button', { name: TYPE.label.ar }));
  await userEvent.click(
    screen.getByRole('button', { name: REQUEST_COPY.nav.next.ar }),
  );
}

describe('RequestForm (P8.E-5 multi-step → lead)', () => {
  it('blocks step 1 until a project type is chosen, then advances', async () => {
    const onSubmit = vi.fn(async () => undefined);
    setup(onSubmit);
    // Next with nothing chosen → please-select, still on step 1
    await userEvent.click(
      screen.getByRole('button', { name: REQUEST_COPY.nav.next.ar }),
    );
    expect(
      await screen.findByText(REQUEST_COPY.project.pleaseSelect.ar),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(REQUEST_COPY.brief.heading.ar),
    ).not.toBeInTheDocument();
    // choose a type → Next advances to the brief step
    await toBrief();
    expect(
      await screen.findByText(REQUEST_COPY.brief.heading.ar),
    ).toBeInTheDocument();
  });

  it('marks the chosen choice card pressed and preserves it across Back', async () => {
    setup(vi.fn(async () => undefined));
    const card = screen.getByRole('button', { name: TYPE.label.ar });
    expect(card).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(
      screen.getByRole('button', { name: REQUEST_COPY.nav.next.ar }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: REQUEST_COPY.nav.back.ar }),
    );
    // back on step 1 with the selection intact
    expect(screen.getByRole('button', { name: TYPE.label.ar })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('blocks the brief step when the message is empty', async () => {
    const onSubmit = vi.fn(async () => undefined);
    setup(onSubmit);
    await toBrief();
    await userEvent.click(
      screen.getByRole('button', { name: REQUEST_COPY.nav.next.ar }),
    );
    await waitFor(() =>
      expect(screen.getByText(ar.contact.required)).toBeInTheDocument(),
    );
    // still on the brief step (not on the "about you" step)
    expect(
      screen.queryByText(REQUEST_COPY.you.heading.ar),
    ).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an invalid email on the final step', async () => {
    const onSubmit = vi.fn(async () => undefined);
    setup(onSubmit);
    await toBrief();
    await userEvent.type(
      screen.getByLabelText(ar.contact.message),
      'أريد بناء منصة',
    );
    await userEvent.click(
      screen.getByRole('button', { name: REQUEST_COPY.nav.next.ar }),
    );
    await userEvent.type(screen.getByLabelText(ar.contact.name), 'سارة');
    await userEvent.type(
      screen.getByLabelText(ar.contact.email),
      'not-an-email',
    );
    await userEvent.click(
      screen.getByRole('button', { name: ar.contact.submit }),
    );
    await waitFor(() =>
      expect(screen.getByText(ar.contact.invalidEmail)).toBeInTheDocument(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a request-project lead with the chosen canonical values, then shows success', async () => {
    const onSubmit = vi.fn(async (_v: LeadCreateRequest) => undefined);
    setup(onSubmit);
    // step 1: type + budget
    await userEvent.click(screen.getByRole('button', { name: TYPE.label.ar }));
    await userEvent.click(
      screen.getByRole('button', { name: BUDGET.label.ar }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: REQUEST_COPY.nav.next.ar }),
    );
    // step 2: brief
    await userEvent.type(
      screen.getByLabelText(ar.contact.message),
      'أريد بناء منصة تعليمية',
    );
    await userEvent.click(
      screen.getByRole('button', { name: REQUEST_COPY.nav.next.ar }),
    );
    // step 3: contact + submit
    await userEvent.type(screen.getByLabelText(ar.contact.name), 'سارة');
    await userEvent.type(
      screen.getByLabelText(ar.contact.email),
      'sara@example.com',
    );
    await userEvent.type(screen.getByLabelText(ar.contact.phone), '501234567');
    await userEvent.click(
      screen.getByRole('button', { name: ar.contact.submit }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      name: 'سارة',
      email: 'sara@example.com',
      phone: '+966501234567',
      message: 'أريد بناء منصة تعليمية',
      projectType: TYPE.value,
      budget: BUDGET.value,
      source: 'request-project',
      locale: 'ar',
    });
    expect(
      await screen.findByText(REQUEST_COPY.success.title.ar),
    ).toBeInTheDocument();
  });

  it('shows an error alert and keeps the form when the submission fails', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('boom');
    });
    setup(onSubmit);
    await toBrief();
    await userEvent.type(screen.getByLabelText(ar.contact.message), 'مرحبا');
    await userEvent.click(
      screen.getByRole('button', { name: REQUEST_COPY.nav.next.ar }),
    );
    await userEvent.type(screen.getByLabelText(ar.contact.name), 'سارة');
    await userEvent.type(
      screen.getByLabelText(ar.contact.email),
      'sara@example.com',
    );
    await userEvent.type(screen.getByLabelText(ar.contact.phone), '501234567');
    await userEvent.click(
      screen.getByRole('button', { name: ar.contact.submit }),
    );
    expect(await screen.findByText(ar.contact.error)).toBeInTheDocument();
    // the success view did NOT replace the form
    expect(
      screen.queryByText(REQUEST_COPY.success.title.ar),
    ).not.toBeInTheDocument();
  });
});
