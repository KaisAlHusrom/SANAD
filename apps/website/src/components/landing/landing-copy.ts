import type { Locale, LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the landing's bespoke sections (U9/WEB1) — the safety net that renders
 * when the CMS hasn't supplied a section/field yet, so the page is **never blank**. The seeded
 * `landing` page-tree overrides hero/trust/services/process/stats/cta; the chrome here (eyebrows,
 * micro-labels, capability fallbacks, CTA steps) backs the rest. Rewritten 2026-07-07 (owner
 * directive): one story arc — الإقلاع → المجالات → الأنظمة → آلية العمل → الدليل → السجل →
 * الإطلاق — with numbered editorial eyebrows (Arabic-Indic in ar) while instrument micro-labels
 * (SYS·01, TRX·01, dates, counters) stay mono LTR Western digits in both locales.
 */

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

export const LANDING_COPY = {
  hero: {
    eyebrow: t('سَنَد التقنية — بيت برمجيات', 'SANAD TECH — SOFTWARE HOUSE'),
    title: t(
      'نَبني نظامك،<br>ونبقى سَنَدَك بعد الإطلاق',
      'We build your system —<br>and back you after launch',
    ),
    lead: t(
      'نحوّل فكرتك إلى منتجٍ حيٍّ يعمل: أنظمة SaaS، تطبيقات جوال، منصّات تعلّم، وأنظمة ERP — مرحلةً واضحةً تلو الأخرى.',
      'We turn your idea into a live, working product: SaaS, mobile apps, learning platforms and ERP systems — one clear phase at a time.',
    ),
    startJourney: t('ابدأ الرحلة', 'Begin the journey'),
    seeWork: t('شاهد أعمالنا', 'See our work'),
    proof: [
      t('اجتماعٌ أسبوعيٌّ معك', 'A weekly meeting with you'),
      t('تسليمٌ على مراحل', 'Phase-by-phase delivery'),
      t('دعمٌ بعد الإطلاق', 'Post-launch support'),
    ],
  },
  trust: {
    eyebrow: t('٠١ · المجالات', '01 · DOMAINS'),
    title: t(
      'الأنظمة التي تُشغّل أعمال المنطقة',
      'The systems that run the region’s business',
    ),
    lead: t(
      'أنظمةٌ حيّة يعتمد عليها الناس كلَّ يوم — من المدفوعات والتجارة إلى اللوجستيات والموارد البشرية والصحة الرقمية.',
      'Live systems people rely on every day — from payments and commerce to logistics, HR and digital health.',
    ),
  },
  services: {
    eyebrow: t('٠٢ · الأنظمة', '02 · SYSTEMS'),
    title: t('قدرةٌ كاملة تحت سقفٍ واحد', 'A full capability under one roof'),
    lead: t(
      'من أول ورشة اكتشافٍ إلى ما بعد الإطلاق — فريقٌ واحد يصمّم ويبني ويُشغّل.',
      'From the first discovery workshop to well past launch — one team designs, builds and operates.',
    ),
    /** Capability bullets + tech signature per known service slug — the coded fallback when the
     * CMS `services` section carries no joined blocks (U9). Keys match the seeded service slugs. */
    systems: {
      saas: {
        caps: [
          t(
            'بنيةٌ متعددة المستأجرين تنمو من عميلك الأول إلى المليون',
            'Multi-tenant architecture that scales from customer one to a million',
          ),
          t(
            'اشتراكاتٌ وفوترةٌ ومدفوعاتٌ جاهزة من اليوم الأول',
            'Subscriptions, billing and payments ready from day one',
          ),
          t(
            'لوحاتُ تحكّمٍ وتقارير لحظية لفريقك وعملائك',
            'Live dashboards and reporting for your team and your customers',
          ),
        ],
        tech: 'NestJS · Postgres · React · K8s',
      },
      mobile: {
        caps: [
          t(
            'تطبيقٌ واحد لـ iOS وأندرويد بأداءٍ أصيل',
            'One codebase, native-grade iOS & Android',
          ),
          t(
            'يعمل دون اتصالٍ ويتزامن عند العودة',
            'Works offline, syncs when back online',
          ),
          t(
            'إشعاراتٌ وتحليلاتٌ وقياسُ تفاعُلٍ مدمجة',
            'Push, analytics and engagement built in',
          ),
        ],
        tech: 'React Native · TypeScript · Fastlane',
      },
      lms: {
        caps: [
          t(
            'مساراتٌ وتقييماتٌ وشهاداتٌ قابلة للاعتماد',
            'Paths, assessments and accreditable certificates',
          ),
          t(
            'بثٌّ وتفاعلٌ مباشرٌ داخل الصف الرقمي',
            'Live streaming and interaction in the digital classroom',
          ),
          t(
            'متابعةُ تقدّمٍ لحظية للطالب والمشرف',
            'Real-time progress for learner and supervisor',
          ),
        ],
        tech: 'Next.js · Postgres · WebRTC',
      },
      erp: {
        caps: [
          t(
            'الموارد والمخزون والمحاسبة في منظومةٍ واحدة',
            'Resources, inventory and accounting in one system',
          ),
          t(
            'سيرُ اعتماداتٍ يطابق هيكلك الإداري',
            'Approval flows that mirror your org structure',
          ),
          t(
            'تقاريرُ إدارةٍ تُبنى على بياناتك الحيّة',
            'Management reporting on your live data',
          ),
        ],
        tech: 'NestJS · RabbitMQ · Postgres',
      },
    } as Record<string, { caps: LocalizedText[]; tech: string }>,
  },
  process: {
    eyebrow: t('٠٣ · آلية العمل', '03 · METHOD'),
    title: t('مسارٌ واضح، مرحلةً تلو الأخرى', 'A clear path, phase by phase'),
    give: t('ماذا تستلم', 'What you receive'),
  },
  works: {
    eyebrow: t('٠٤ · أعمالنا', '04 · OUR WORK'),
    title: t('أعمالٌ تتحدّث بالأرقام', 'Work that speaks in numbers'),
    hint: t(
      'مشاريع أطلقناها لعملاء حقيقيين — ونتائجها قابلة للقياس.',
      'Projects we shipped for real clients — with measurable results.',
    ),
    challenge: t('التحدّي', 'CHALLENGE'),
    result: t('النتيجة', 'RESULT'),
  },
  stats: {
    eyebrow: t('٠٥ · بالأرقام', '05 · TELEMETRY'),
    title: t('أرقامٌ تختصر الرحلة', 'The numbers behind the voyage'),
  },
  testimonials: {
    eyebrow: t('٠٦ · إشاراتٌ واردة', '06 · TRANSMISSIONS'),
    title: t(
      'ماذا يقول شركاؤنا بعد الإطلاق',
      'What our partners say after launch',
    ),
  },
  blog: {
    eyebrow: t('٠٧ · سجل الرحلة', '07 · SHIP’S LOG'),
    title: t('ممّا نتعلّمه ونحن نبني', 'What we learn as we build'),
    all: t('كل المقالات', 'All articles'),
    empty: t(
      'أولى التدوينات قيد الكتابة — عُد قريبًا.',
      'The first entries are being written — check back soon.',
    ),
  },
  cta: {
    eyebrow: t('الطبقة الأخيرة — الإطلاق', 'FINAL LAYER — LAUNCH'),
    title: t('جاهزون لنَسنِد مشروعك القادم', 'Ready to back your next project'),
    lead: t(
      'احجز جلسة اكتشافٍ مجّانية، ولنرسم معًا أول مرحلة من الطريق.',
      'Book a free discovery session and let’s map the first phase together.',
    ),
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
    ],
  },
  /** the constellation wayfinder rail (8.B-4) — short business words, never space narration */
  wayfinder: {
    ariaLabel: t('التنقّل بين أقسام الصفحة', 'Page section navigation'),
    stations: {
      hero: t('البداية', 'Start'),
      trust: t('المجالات', 'Domains'),
      services: t('الخدمات', 'Services'),
      process: t('آلية العمل', 'Method'),
      works: t('أعمالنا', 'Our work'),
      stats: t('بالأرقام', 'Numbers'),
      testimonials: t('آراء العملاء', 'Clients'),
      blog: t('المدوّنة', 'Blog'),
      cta: t('ابدأ مشروعك', 'Start a project'),
    },
  },
} as const;

/** Resolve a coded-default LocalizedText to the active locale. */
export function copy(value: LocalizedText, locale: Locale): string {
  return value[locale];
}
