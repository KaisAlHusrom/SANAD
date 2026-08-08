import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `hero` section (F7/WEB1) — the safety net so the hero is never blank.
 * Lives WITH the shared component (single source): the website (live) and the admin preview show
 * the identical fallback. `<br>` in the title is honored as a line break by the headline slot.
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const HERO_COPY = {
  eyebrow: t('سَنَد التقنية — بيت برمجيات', 'SANAD TECH — SOFTWARE HOUSE'),
  title: t(
    'نَبني نظامك،<br>ونبقى سَنَدَك بعد الإطلاق',
    'We build your system —<br>and back you after launch',
  ),
  lead: t(
    'نحوّل فكرتك إلى منتجٍ حيٍّ يعمل: أنظمة SaaS، تطبيقات جوال، منصّات تعلّم، وأنظمة ERP — مرحلةً واضحةً تلو الأخرى.',
    'We turn your idea into a live, working product: SaaS, mobile apps, learning platforms and ERP systems — one clear phase at a time.',
  ),
  startProject: t('ابدأ مشروعك', 'Start your project'),
  seeWork: t('شاهد أعمالنا', 'See our work'),
  proof: [
    t('اجتماعٌ أسبوعيٌّ معك', 'A weekly meeting with you'),
    t('تسليمٌ على مراحل', 'Phase-by-phase delivery'),
    t('دعمٌ بعد الإطلاق', 'Post-launch support'),
  ] as LocalizedText[],
};
