import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `services` capability chapter (F7/WEB1) — the safety net so the
 * section head + each system's capability bullets/tech signature are never blank. Lives WITH the
 * shared component (single source): the website (live) and the admin preview show the identical
 * fallback. Byte-copied from the website's `LANDING_COPY.services` so the swap introduces no copy
 * regression. `systems` keys match the seeded service slugs; used only when the CMS `services`
 * section carries no joined `feature`/`text` blocks for that slug (U9).
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export interface ServiceSystemCopy {
  caps: LocalizedText[];
  tech: string;
}

export const SERVICES_COPY = {
  eyebrow: t('٠٢ · الأنظمة', '02 · SYSTEMS'),
  title: t('قدرةٌ كاملة تحت سقفٍ واحد', 'A full capability under one roof'),
  lead: t(
    'من أول ورشة اكتشافٍ إلى ما بعد الإطلاق — فريقٌ واحد يصمّم ويبني ويُشغّل.',
    'From the first discovery workshop to well past launch — one team designs, builds and operates.',
  ),
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
  } as Record<string, ServiceSystemCopy>,
};
