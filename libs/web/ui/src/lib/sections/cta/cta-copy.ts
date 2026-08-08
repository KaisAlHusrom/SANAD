import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `cta` launch band (F7/WEB1) — the safety net so the closing call to
 * action is never blank. Lives WITH the shared component (single source): the website (live) and the
 * admin preview show the identical fallback. Byte-copied from the website's `LANDING_COPY.cta`
 * (+ `dict.cta.startProject` / `LANDING_COPY.hero.seeWork` for the two CTA labels) so the swap
 * introduces no copy regression.
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const CTA_COPY = {
  eyebrow: t('الطبقة الأخيرة — الإطلاق', 'FINAL LAYER — LAUNCH'),
  title: t('جاهزون لنَسنِد مشروعك القادم', 'Ready to back your next project'),
  lead: t(
    'احجز جلسة اكتشافٍ مجّانية، ولنرسم معًا أول مرحلة من الطريق.',
    'Book a free discovery session and let’s map the first phase together.',
  ),
  /** The primary CTA label — byte-identical to `dict.cta.startProject` (single-sourced, no regression). */
  startProject: t('ابدأ مشروعك', 'Start your project'),
  /** The ghost CTA label — the `#works` anchor glide, from `LANDING_COPY.hero.seeWork`. */
  seeWork: t('شاهد أعمالنا', 'See our work'),
  stepsTitle: t('ماذا يحدث بعد رسالتك؟', 'What happens after you reach out?'),
  steps: [
    t(
      'مكالمةُ اكتشافٍ قصيرة نفهم فيها فكرتك وهدفك',
      'A short discovery call — your idea and your goal',
    ),
    t(
      'نرسم النطاق ونقسّمه مراحل، بتكلفةٍ وجدولٍ واضحَين',
      'We map the scope into phases, with clear cost and timeline',
    ),
    t(
      'نبدأ المرحلة الأولى — وترى تقدّمها كلَّ أسبوع',
      'We start phase one — and you watch it progress every week',
    ),
  ] as LocalizedText[],
};
