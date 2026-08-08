import type { LocalizedText } from '@sanad/contracts';
import { METHOD_PHASES } from '../services/services-copy';

/**
 * Coded-default copy for the standalone Process page (U9/WEB1) — there is no CMS entity for
 * "process" (the landing page's own `process` section is CMS `step`/`feature` blocks scoped to
 * that page, not reusable here); this whole page is coded chrome, like Services' supporting-
 * capabilities/tech-stack sections. The 4 phase title/short-desc pairs are REUSED from
 * `METHOD_PHASES` (F9 — one phrasing of the phased-delivery method, not re-authored); duration
 * + deliverables are new fields for this page's deeper treatment.
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

type PhaseKey = (typeof METHOD_PHASES)[number]['key'];

/** Duration + deliverables per phase key, keyed to `METHOD_PHASES` (F9 — see above). */
const PHASE_DETAILS: Record<
  PhaseKey,
  { duration: LocalizedText; deliverables: LocalizedText[] }
> = {
  discover: {
    duration: t('أسبوعٌ إلى أسبوعين', '1–2 weeks'),
    deliverables: [
      t('نطاقٌ مكتوب', 'A written scope'),
      t('خريطةٌ زمنية', 'A timeline'),
    ],
  },
  design: {
    duration: t('أسبوعان إلى ثلاثة', '2–3 weeks'),
    deliverables: [
      t('تصميمٌ تعتمده', 'A design you approve'),
      t('نموذجٌ تفاعلي', 'An interactive prototype'),
    ],
  },
  build: {
    duration: t(
      'مرحلةً تلو الأخرى، أسابيع',
      'Phase by phase, over several weeks',
    ),
    deliverables: [
      t('تسليمٌ أسبوعي', 'A weekly delivery'),
      t('بيئةٌ تراها تعمل', 'An environment you can watch run'),
    ],
  },
  launch: {
    duration: t('إطلاقٌ وبقاءٌ مستمر', 'Launch, then ongoing'),
    deliverables: [
      t('نظامٌ حيّ على السحابة', 'A live system on the cloud'),
      t('عقد دعمٍ وتطوير', 'A support & iteration contract'),
    ],
  },
};

export const PROCESS_PHASES = METHOD_PHASES.map((phase) => ({
  ...phase,
  ...PHASE_DETAILS[phase.key],
}));

export const PROCESS_COPY = {
  hero: {
    eyebrow: t('آلية العمل', 'How we work'),
    title: t('مسارٌ واضح، مرحلةً تلو الأخرى', 'A clear path, phase by phase'),
    subtitle: t(
      'لا مفاجآت ولا غموض. نُسلّم في كل مرحلة شيئًا تراه وتعتمده، باجتماعٍ أسبوعيٍّ يُبقيك على المسار من أول فكرة إلى ما بعد الإطلاق.',
      'No surprises, no guesswork. Each phase delivers something you see and approve, with a weekly meeting that keeps you on track from the first idea to well after launch.',
    ),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
  phases: {
    eyebrow: t('المراحل الأربع', 'The four phases'),
    title: t('من فكرةٍ إلى نظامٍ حيّ', 'From idea to a live system'),
    give: t('ماذا تستلم', 'What you receive'),
  },
  meeting: {
    eyebrow: t('اجتماعٌ أسبوعيّ', 'A weekly meeting'),
    title: t(
      'لقاءٌ ثابت، لا تقاريرُ مؤجَّلة',
      'A standing meeting, never a delayed report',
    ),
    body: t(
      'كل أسبوع، تجلس مع الفريق لترى ما أُنجز، وما القادم، وتتّخذ القرار مباشرة. لا تنتظر تقريرًا شهريًّا لتكتشف أن المسار انحرف.',
      'Every week, you sit with the team to see what shipped, what’s next, and decide on the spot — never waiting on a monthly report to discover the path drifted.',
    ),
  },
  support: {
    eyebrow: t('الدعم بعد التسليم', 'Post-launch support'),
    title: t('سَنَدٌ يبقى بعد الإطلاق', 'Backing that stays past launch'),
    body: t(
      'الإطلاق ليس النهاية. نبقى بعقود دعمٍ باستجابةٍ مضمونة، مراقبةٍ على مدار الساعة، وتطويرٍ مستمر — نفس الفريق الذي بنى النظام هو من يسنده.',
      'Launch isn’t the finish line. We stay with support contracts under guaranteed response, round-the-clock monitoring, and ongoing iteration — the same team that built the system keeps backing it.',
    ),
  },
  cta: {
    title: t(
      'جاهزون نرسم لك المرحلة الأولى؟',
      'Ready to map your first phase?',
    ),
    subtitle: t(
      'ابدأ بمكالمةٍ قصيرة، ودَعنا نحدّد النطاق والخريطة الزمنية.',
      'Start with a short call and let us define the scope and timeline.',
    ),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
} as const;
