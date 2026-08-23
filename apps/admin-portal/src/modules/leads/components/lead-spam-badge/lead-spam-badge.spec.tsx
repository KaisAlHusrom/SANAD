import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LeadSpamSignal } from '@sanad/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../../../../i18n';
import '../../i18n';
import { LeadSpamBadge } from './lead-spam-badge';

const signals: LeadSpamSignal[] = [
  { id: 'keywords', weight: 45, n: 3 },
  { id: 'links', weight: 36, n: 3 },
  { id: 'shouting', weight: 10 },
];

function renderBadge(score: number, spamSignals: LeadSpamSignal[] = signals) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LeadSpamBadge score={score} signals={spamSignals} />
    </I18nextProvider>,
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('LeadSpamBadge (P8.10.B3)', () => {
  it('stays completely quiet for a clean lead — a badge on every row is noise', () => {
    const { container } = renderBadge(0, []);
    expect(container).toBeEmptyDOMElement();
  });

  it('stays quiet for a lead scored below the suspicious band', () => {
    const { container } = renderBadge(12, [{ id: 'links', weight: 12, n: 1 }]);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the score for a suspicious lead', () => {
    renderBadge(30, [{ id: 'keywords', weight: 30, n: 2 }]);
    expect(screen.getByRole('button', { name: /30/ })).toBeInTheDocument();
  });

  it('shows the score for a likely-spam lead', () => {
    renderBadge(91);
    expect(screen.getByRole('button', { name: /91/ })).toBeInTheDocument();
  });

  it('distinguishes the two bands visually, not only by number', () => {
    const { container: suspicious } = renderBadge(30, [
      { id: 'keywords', weight: 30, n: 2 },
    ]);
    const { container: likely } = renderBadge(91);
    expect(suspicious.querySelector('[data-verdict]')).toHaveAttribute(
      'data-verdict',
      'suspicious',
    );
    expect(likely.querySelector('[data-verdict]')).toHaveAttribute(
      'data-verdict',
      'likelySpam',
    );
  });

  it('breaks the score down into the signals that produced it', async () => {
    const user = userEvent.setup();
    renderBadge(91);
    await user.click(screen.getByRole('button', { name: /91/ }));

    expect(await screen.findByText(/spam phrases/i)).toBeInTheDocument();
    expect(screen.getByText(/links/i)).toBeInTheDocument();
    expect(screen.getByText(/shouting/i)).toBeInTheDocument();
    expect(screen.getByText('+45')).toBeInTheDocument();
  });

  it('shows how many times a counted signal fired, with no i18next placeholder left behind', async () => {
    const user = userEvent.setup();
    renderBadge(91);
    await user.click(screen.getByRole('button', { name: /91/ }));

    // 3 phrases and 3 links. The count is appended in JSX rather than interpolated, precisely so
    // no catalog key carries a `{{count}}` that i18next would read as a plural selector — Arabic
    // has six plural forms and the ar/en key trees must stay identical (F13).
    expect(await screen.findAllByText(/\(3\)/)).toHaveLength(2);
    expect(screen.queryByText(/\{\{/)).not.toBeInTheDocument();
    // A signal with no count says nothing rather than "(1)".
    expect(screen.getByText('Shouting')).toBeInTheDocument();
  });

  it('says plainly that the score never blocks a lead — the team must trust the inbox', async () => {
    const user = userEvent.setup();
    renderBadge(91);
    await user.click(screen.getByRole('button', { name: /91/ }));
    expect(await screen.findByText(/never blocks/i)).toBeInTheDocument();
  });

  it('keeps the signed weight readable in Arabic (RTL) by pinning it LTR', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('ar');
    renderBadge(91);
    await user.click(screen.getByRole('button', { name: /91/ }));
    const weight = await screen.findByText('+45');
    expect(weight).toHaveAttribute('dir', 'ltr');
  });

  it('still renders a breakdown when a scored lead has no signals left to show', async () => {
    const user = userEvent.setup();
    renderBadge(70, []);
    await user.click(screen.getByRole('button', { name: /70/ }));
    // No empty box: the score itself is the fallback line.
    expect(await screen.findByText(/never blocks/i)).toBeInTheDocument();
  });
});
