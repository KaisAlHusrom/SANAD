import { spamVerdictOf, type LeadSpamSignal } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../../components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover';

interface LeadSpamBadgeProps {
  score: number;
  signals: LeadSpamSignal[];
}

/**
 * The inbox's spam signal (P8.10.B3) — a score pill that opens the breakdown behind it.
 *
 * Renders NOTHING for a clean lead: a badge on every row is noise, not a signal, and most leads
 * are clean. The breakdown exists because a bare number is not actionable — the team needs to see
 * that it scored on three links and a keyword before they trust it, and the footer says outright
 * that nothing was blocked, so a high score reads as a ranking rather than a rejection.
 */
export function LeadSpamBadge({ score, signals }: LeadSpamBadgeProps) {
  const { t } = useTranslation('leads');
  const verdict = spamVerdictOf(score);

  if (verdict === 'clean') {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          aria-label={t('spam.badgeLabel', {
            score,
            verdict: t(`spam.verdicts.${verdict}`),
          })}
        >
          <Badge
            tone={verdict === 'likelySpam' ? 'bad' : 'warn'}
            data-verdict={verdict}
            dot
          >
            <span dir="ltr">{score}</span>
          </Badge>
        </button>
      </PopoverTrigger>
      {/* The content is trigger-width-matched by default — a breakdown needs its own width, and
          its own scroll, so a long list never escapes the overlay (U0). */}
      <PopoverContent className="flex max-h-80 w-auto min-w-64 flex-col gap-2 overflow-y-auto p-3">
        <p className="text-xs font-semibold text-text">
          {t(`spam.verdicts.${verdict}`)}
        </p>
        <ul className="flex flex-col gap-1.5">
          {signals.map((signal) => (
            <li
              key={signal.id}
              className="flex items-center justify-between gap-4 text-xs text-dim"
            >
              <span>
                {t(`spam.signals.${signal.id}`)}
                {signal.n === undefined ? null : ` (${String(signal.n)})`}
              </span>
              {/* A signed number in an RTL row renders as `45+` unless it is pinned LTR (U7). */}
              <span className="font-mono text-faint" dir="ltr">
                +{signal.weight}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-border-2 pt-2 text-xs text-faint">
          {t('spam.advisory')}
        </p>
      </PopoverContent>
    </Popover>
  );
}
