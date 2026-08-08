import type { Locale, LocalizedText } from '@sanad/contracts';
import { LANDING_COPY } from '../../landing/landing-copy';

/**
 * Coded-default copy for the Services pages (U9/WEB1) — transcribed from
 * `.claude/design/content-defaults.md` §services + §service-detail. The CMS `service`
 * entities supply each card's title/summary/detailBody; this file backs the page chrome
 * (hero, section eyebrows, the supporting-capabilities set, the phased method, the tech
 * strip, CTAs) so the page is never blank. Per-service capability/tech fallbacks are REUSED
 * from `LANDING_COPY.services.systems` (F9) — one source for the 4 core slugs.
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

/** The Sanad phased-delivery method — the same 4 phases the landing tells (F9), reused here. */
export const METHOD_PHASES = [
  {
    key: 'discover',
    title: t('اكتشاف', 'Discover'),
    desc: t(
      'نفهم فكرتك وهدفك ونرسم النطاق.',
      'We understand your idea and goal, and map the scope.',
    ),
  },
  {
    key: 'design',
    title: t('تصميم', 'Design'),
    desc: t(
      'تجربةٌ وواجهاتٌ تحترم لغتك واتجاهك.',
      'Experience and interfaces that respect your language and direction.',
    ),
  },
  {
    key: 'build',
    title: t('تطوير', 'Build'),
    desc: t(
      'نبني مرحلةً تلو الأخرى، وتراها تنمو كل أسبوع.',
      'We build phase by phase — you watch it grow every week.',
    ),
  },
  {
    key: 'launch',
    title: t('إطلاق', 'Launch'),
    desc: t(
      'نُطلق، ثم نبقى سندًا بعقود دعمٍ وتطوير.',
      'We launch, then stay your backing with support and iteration.',
    ),
  },
] as const;

/** The cross-cutting stack Sanad builds on (LTR mono — never mirrored, WEB6). */
export const TECH_STACK = [
  'NestJS',
  'React',
  'Next.js',
  'React Native',
  'PostgreSQL',
  'RabbitMQ',
  'Redis',
  'Docker',
  'Kubernetes',
  'TypeScript',
] as const;

export const SERVICES_COPY = {
  hero: {
    eyebrow: t('خدماتنا', 'Our services'),
    title: t(
      'قدرةٌ واحدة متكاملة، من الفكرة إلى ما بعد الإطلاق',
      'One integrated capability — from idea to beyond launch',
    ),
    subtitle: t(
      'من المنصّة إلى الجوال إلى البنية الخلفية، فريقٌ واحدٌ يحمل مشروعك ثم يبقى معك. اختر القدرة لتغوص في تفاصيلها.',
      'From platform to mobile to backend, one team carries your project — then stays with you. Pick a capability to go deeper.',
    ),
    explore: t('استكشف القدرات', 'Explore capabilities'),
    talk: t('تواصل معنا', 'Get in touch'),
  },
  core: {
    eyebrow: t('٠١ · الخدمات الأساسية', '01 · CORE SERVICES'),
    title: t('ما الذي نبنيه', 'What we build'),
  },
  support: {
    eyebrow: t('٠٢ · قدراتٌ مساندة', '02 · SUPPORTING CAPABILITIES'),
    title: t('وكل ما يجعلها تعمل', 'And everything that makes it work'),
    /** The 4 supporting capabilities (content-defaults) — coded defaults; not seeded as `service`s. */
    items: [
      {
        key: 'ux',
        title: t('تصميم المنتج', 'Product design (UX/UI)'),
        desc: t(
          'أبحاثٌ وتجربةُ مستخدمٍ وواجهاتٌ تحترم لغتك واتجاهك.',
          'Research, UX and interfaces that respect your language and direction.',
        ),
      },
      {
        key: 'api',
        title: t('التكامل وواجهات API', 'Integrations & APIs'),
        desc: t(
          'ربطٌ موثوق مع أنظمتك القائمة والأنظمة الخارجية.',
          'Reliable links to your existing systems and third parties.',
        ),
      },
      {
        key: 'cloud',
        title: t('السحابة و DevOps', 'Cloud & DevOps'),
        desc: t(
          'بنيةٌ تحتية، نشرٌ آليّ، ومراقبةٌ على مدار الساعة.',
          'Infrastructure, automated deployment and round-the-clock monitoring.',
        ),
      },
      {
        key: 'sla',
        title: t('الدعم بعد التسليم', 'Post-launch support'),
        desc: t(
          'عقودُ دعمٍ باستجابةٍ مضمونة وتطويرٍ مستمر.',
          'Support contracts with guaranteed response and ongoing iteration.',
        ),
      },
    ],
  },
  method: {
    eyebrow: t('٠٣ · آلية العمل', '03 · METHOD'),
    title: t('مسارٌ واضح، مرحلةً تلو الأخرى', 'A clear path, phase by phase'),
    subtitle: t(
      'نُسلّم في كل مرحلة شيئًا تراه وتعتمده، باجتماعٍ أسبوعيٍّ يُبقيك على المسار.',
      'Each phase delivers something you see and approve, with a weekly meeting that keeps you on track.',
    ),
  },
  tech: {
    eyebrow: t('٠٤ · التقنيات', '04 · TECH STACK'),
    title: t(
      'بنيةٌ حديثة، مُثبتةٌ في الإنتاج',
      'A modern stack, proven in production',
    ),
  },
  cta: {
    eyebrow: t('لنبدأ', 'LET’S BEGIN'),
    title: t(
      'لكلِّ فكرةٍ مسارُها. أيُّها يخدم مشروعك؟',
      'Every idea has its path. Which one serves yours?',
    ),
    subtitle: t(
      'احجز مكالمةً قصيرة ونرسم معًا أنسب مسار.',
      'Book a short call and we’ll map the right path together.',
    ),
    talk: t('تواصل معنا', 'Get in touch'),
  },
} as const;

export const SERVICE_DETAIL_COPY = {
  home: t('خدماتنا', 'Services'),
  back: t('كل الخدمات', 'All services'),
  hero: {
    talk: t('ابدأ مشروعك', 'Start your project'),
    explore: t('استكشف القدرات', 'Explore capabilities'),
  },
  caps: {
    eyebrow: t('ما الذي تحصل عليه', 'What you get'),
    title: t(
      'منظومةٌ كاملة، لا مجرّد واجهة',
      'A complete system, not just a UI',
    ),
  },
  journey: {
    eyebrow: t('كيف نبنيها', 'How we build it'),
    title: t(
      'من فكرةٍ إلى نظامٍ حيّ، مرحلةً تلو الأخرى',
      'From idea to a live system, phase by phase',
    ),
    subtitle: t(
      'نُسلّم في كل مرحلة شيئًا تراه وتعتمده، باجتماعٍ أسبوعيٍّ يُبقيك على المسار.',
      'Each phase delivers something you see and approve, with a weekly meeting that keeps you on track.',
    ),
  },
  guarantees: {
    eyebrow: t('ما تعتمد عليه', 'What you can count on'),
    title: t('سَنَدٌ يبقى بعد الإطلاق', 'Backing that stays past launch'),
    items: [
      {
        key: 'weekly',
        title: t('اجتماعٌ أسبوعيّ', 'A weekly meeting'),
        desc: t(
          'لقاءٌ ثابت مع المالك تُتابع فيه التقدّم وتتّخذ القرار.',
          'A standing owner meeting to track progress and decide.',
        ),
      },
      {
        key: 'phases',
        title: t('تسليمٌ على مراحل', 'Phase-by-phase delivery'),
        desc: t(
          'كل مرحلة تُسلَّم وتُعتمد قبل ما بعدها — لا مفاجآت.',
          'Each phase is delivered and approved before the next — no surprises.',
        ),
      },
      {
        key: 'support',
        title: t('دعمٌ بعد الإطلاق', 'Post-launch support'),
        desc: t(
          'عقودُ دعمٍ باستجابةٍ مضمونة وتطويرٍ مستمر.',
          'Support contracts with guaranteed response and ongoing iteration.',
        ),
      },
    ],
  },
  tech: {
    eyebrow: t('التقنيات', 'Tech'),
    title: t('ما نبنيه به', 'What we build it with'),
  },
  related: {
    eyebrow: t('خدماتٌ ذات صلة', 'Related services'),
    title: t(
      'قدراتٌ أخرى قد تخدم مشروعك',
      'Other capabilities that may serve you',
    ),
  },
  cta: {
    title: t('جاهزٌ لبناء نظامك؟', 'Ready to build your system?'),
    subtitle: t(
      'نبدأ بمرحلة اكتشافٍ قصيرة نرسم فيها النطاق والخريطة الزمنية.',
      'We start with a short discovery phase to map scope and timeline.',
    ),
    talk: t('ابدأ مشروعك', 'Start your project'),
  },
} as const;

/**
 * Per-service capability bullets + tech signature — REUSED from the landing systems copy
 * (F9) for the 4 core slugs, with a generic Sanad fallback for any other slug so a
 * newly-added service still renders a full detail page.
 */
export function serviceSystem(slug: string): {
  caps: LocalizedText[];
  tech: string;
} {
  return (
    LANDING_COPY.services.systems[slug] ?? {
      caps: [
        t(
          'بنيةٌ نظيفة قابلة للتوسّع من أول مستخدمٍ إلى المليون',
          'A clean architecture that scales from your first user to your millionth',
        ),
        t(
          'واجهاتٌ تحترم لغتك واتجاهك، بأداءٍ سلس',
          'Interfaces that respect your language and direction, with smooth performance',
        ),
        t(
          'تسليمٌ على مراحل بدعمٍ يبقى بعد الإطلاق',
          'Phase-by-phase delivery with support that stays after launch',
        ),
      ],
      tech: 'NestJS · Postgres · React · Docker',
    }
  );
}

/** Resolve a coded-default LocalizedText to the active locale. */
export function copy(value: LocalizedText, locale: Locale): string {
  return value[locale];
}
