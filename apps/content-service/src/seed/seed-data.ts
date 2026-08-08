import type {
  BlockType,
  BlogPostStatus,
  FaqCategory,
  LocalizedText,
  MenuKey,
  SectionType,
  ServiceCategory,
} from '@sanad/contracts';

/**
 * Coded content defaults (U9 / WEB1 / F7) — the bilingual landing-page tree + core services
 * the content-service seeds on first boot so the website never renders blank. Copy is the
 * authored professional voice from `.claude/design/content-defaults.md` (NOT the design
 * placeholders). Brand/global strings (brand.name, tagline) stay in the settings-service
 * (P3) — not duplicated here (U3). Admins edit all of this per-locale from P7.
 */

export interface SeedBlock {
  type: BlockType;
  data?: Record<string, unknown>;
  title?: LocalizedText;
  body?: LocalizedText;
}

export interface SeedSection {
  type: SectionType;
  eyebrow?: LocalizedText;
  title?: LocalizedText;
  subtitle?: LocalizedText;
  blocks: SeedBlock[];
}

export interface SeedPage {
  slug: string;
  title: LocalizedText;
  metaTitle?: LocalizedText;
  metaDescription?: LocalizedText;
  sections: SeedSection[];
}

export interface SeedService {
  slug: string;
  category: ServiceCategory;
  iconKey: string;
  title: LocalizedText;
  summary: LocalizedText;
}

export interface SeedTestimonial {
  authorName: string;
  companyName: string;
  featured: boolean;
  rating: number;
  quote: LocalizedText;
  authorRole: LocalizedText;
  companyDescriptor: LocalizedText;
}

export interface SeedTeamMember {
  slug: string;
  featured: boolean;
  name: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText;
}

export interface SeedPortfolioCategory {
  slug: string;
  name: LocalizedText;
}

export interface SeedPortfolioProject {
  slug: string;
  categorySlug: string | null;
  clientName: string | null;
  featured: boolean;
  title: LocalizedText;
  summary: LocalizedText;
  challenge: LocalizedText;
  solution: LocalizedText;
  result: LocalizedText;
}

export interface SeedFaq {
  category: FaqCategory;
  question: LocalizedText;
  answer: LocalizedText;
}

export interface SeedMenuItem {
  url: string;
  label: LocalizedText;
  /** One level of nesting (footer columns): a parent item + its child links (W6). */
  children?: readonly SeedMenuItem[];
}

export interface SeedMenu {
  key: MenuKey;
  items: readonly SeedMenuItem[];
}

export interface SeedBlogCategory {
  slug: string;
  name: LocalizedText;
  description?: LocalizedText;
}

export interface SeedBlogTag {
  slug: string;
  name: LocalizedText;
}

export interface SeedBlogPost {
  slug: string;
  /** Resolved to ids at seed time (the categories/team are seeded first). */
  categorySlug: string | null;
  authorSlug: string | null;
  tagSlugs: readonly string[];
  status: BlogPostStatus;
  readMinutes?: number;
  title: LocalizedText;
  excerpt?: LocalizedText;
  body?: LocalizedText;
}

const LANDING: SeedPage = {
  slug: 'landing',
  title: { ar: 'الصفحة الرئيسية', en: 'Home' },
  metaTitle: {
    ar: 'سَنَد التقنية — نَبني نظامك، ونبقى سَنَدَك بعد الإطلاق',
    en: 'Sanad Tech — We build your system and stay your backing after launch',
  },
  metaDescription: {
    ar: 'بيت برمجيات يبني أنظمة SaaS وتطبيقات الجوال ومنصّات التعلّم وأنظمة ERP، مرحلةً تلو الأخرى.',
    en: 'A software house building SaaS, mobile, LMS and ERP systems — delivered phase by phase.',
  },
  sections: [
    {
      type: 'hero',
      eyebrow: {
        ar: 'سَنَد التقنية — بيت برمجيات',
        en: 'SANAD TECH — SOFTWARE HOUSE',
      },
      title: {
        ar: 'نَبني نظامك، ونبقى سَنَدَك بعد الإطلاق',
        en: 'We build your system — and back you after launch',
      },
      subtitle: {
        ar: 'نحوّل فكرتك إلى منتجٍ حيٍّ يعمل: أنظمة SaaS، تطبيقات جوال، منصّات تعلّم، وأنظمة ERP — مرحلةً واضحةً تلو الأخرى.',
        en: 'We turn your idea into a live, working product: SaaS, mobile apps, learning platforms and ERP systems — one clear phase at a time.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
        // the hero proof strip (bracket-framed mono markers)
        {
          type: 'feature',
          data: { slot: 'proof' },
          title: {
            ar: 'اجتماعٌ أسبوعيٌّ معك',
            en: 'A weekly meeting with you',
          },
        },
        {
          type: 'feature',
          data: { slot: 'proof' },
          title: { ar: 'تسليمٌ على مراحل', en: 'Phase-by-phase delivery' },
        },
        {
          type: 'feature',
          data: { slot: 'proof' },
          title: { ar: 'دعمٌ بعد الإطلاق', en: 'Post-launch support' },
        },
      ],
    },
    {
      type: 'trust',
      eyebrow: { ar: '٠١ · المجالات', en: '01 · DOMAINS' },
      title: {
        ar: 'الأنظمة التي تُشغّل أعمال المنطقة',
        en: 'The systems that run the region’s business',
      },
      subtitle: {
        ar: 'أنظمةٌ حيّة يعتمد عليها الناس كلَّ يوم — من المدفوعات والتجارة إلى اللوجستيات والموارد البشرية والصحة الرقمية.',
        en: 'Live systems people rely on every day — from payments and commerce to logistics, HR and digital health.',
      },
      blocks: [],
    },
    {
      type: 'services',
      eyebrow: { ar: '٠٢ · الأنظمة', en: '02 · SYSTEMS' },
      title: {
        ar: 'قدرةٌ كاملة تحت سقفٍ واحد',
        en: 'A full capability under one roof',
      },
      subtitle: {
        ar: 'من أول ورشة اكتشافٍ إلى ما بعد الإطلاق — فريقٌ واحد يصمّم ويبني ويُشغّل.',
        en: 'From the first discovery workshop to well past launch — one team designs, builds and operates.',
      },
      // capability bullets + tech signatures joined to each service card by data.service (WEB1)
      blocks: [
        {
          type: 'feature',
          data: { service: 'saas' },
          title: {
            ar: 'بنيةٌ متعددة المستأجرين تنمو من عميلك الأول إلى المليون',
            en: 'Multi-tenant architecture that scales from customer one to a million',
          },
        },
        {
          type: 'feature',
          data: { service: 'saas' },
          title: {
            ar: 'اشتراكاتٌ وفوترةٌ ومدفوعاتٌ جاهزة من اليوم الأول',
            en: 'Subscriptions, billing and payments ready from day one',
          },
        },
        {
          type: 'feature',
          data: { service: 'saas' },
          title: {
            ar: 'لوحاتُ تحكّمٍ وتقارير لحظية لفريقك وعملائك',
            en: 'Live dashboards and reporting for your team and your customers',
          },
        },
        {
          type: 'text',
          data: { service: 'saas', tech: 'NestJS · Postgres · React · K8s' },
        },
        {
          type: 'feature',
          data: { service: 'mobile' },
          title: {
            ar: 'تطبيقٌ واحد لـ iOS وأندرويد بأداءٍ أصيل',
            en: 'One codebase, native-grade iOS & Android',
          },
        },
        {
          type: 'feature',
          data: { service: 'mobile' },
          title: {
            ar: 'يعمل دون اتصالٍ ويتزامن عند العودة',
            en: 'Works offline, syncs when back online',
          },
        },
        {
          type: 'feature',
          data: { service: 'mobile' },
          title: {
            ar: 'إشعاراتٌ وتحليلاتٌ وقياسُ تفاعُلٍ مدمجة',
            en: 'Push, analytics and engagement built in',
          },
        },
        {
          type: 'text',
          data: {
            service: 'mobile',
            tech: 'React Native · TypeScript · Fastlane',
          },
        },
        {
          type: 'feature',
          data: { service: 'lms' },
          title: {
            ar: 'مساراتٌ وتقييماتٌ وشهاداتٌ قابلة للاعتماد',
            en: 'Paths, assessments and accreditable certificates',
          },
        },
        {
          type: 'feature',
          data: { service: 'lms' },
          title: {
            ar: 'بثٌّ وتفاعلٌ مباشرٌ داخل الصف الرقمي',
            en: 'Live streaming and interaction in the digital classroom',
          },
        },
        {
          type: 'feature',
          data: { service: 'lms' },
          title: {
            ar: 'متابعةُ تقدّمٍ لحظية للطالب والمشرف',
            en: 'Real-time progress for learner and supervisor',
          },
        },
        {
          type: 'text',
          data: { service: 'lms', tech: 'Next.js · Postgres · WebRTC' },
        },
        {
          type: 'feature',
          data: { service: 'erp' },
          title: {
            ar: 'الموارد والمخزون والمحاسبة في منظومةٍ واحدة',
            en: 'Resources, inventory and accounting in one system',
          },
        },
        {
          type: 'feature',
          data: { service: 'erp' },
          title: {
            ar: 'سيرُ اعتماداتٍ يطابق هيكلك الإداري',
            en: 'Approval flows that mirror your org structure',
          },
        },
        {
          type: 'feature',
          data: { service: 'erp' },
          title: {
            ar: 'تقاريرُ إدارةٍ تُبنى على بياناتك الحيّة',
            en: 'Management reporting on your live data',
          },
        },
        {
          type: 'text',
          data: { service: 'erp', tech: 'NestJS · RabbitMQ · Postgres' },
        },
      ],
    },
    {
      type: 'process',
      eyebrow: { ar: '٠٣ · آلية العمل', en: '03 · METHOD' },
      title: {
        ar: 'مسارٌ واضح، مرحلةً تلو الأخرى',
        en: 'A clear path, phase by phase',
      },
      blocks: [
        {
          type: 'step',
          data: { step: 1, duration: { ar: 'أسبوع ١–٢', en: 'Weeks 1–2' } },
          title: { ar: 'اكتشاف', en: 'Discovery' },
          body: {
            ar: 'نفهم عملك وأهدافك، ونرسم النطاق والخريطة الزمنية.',
            en: 'We learn your business and goals, then map scope and timeline.',
          },
        },
        {
          type: 'step',
          data: { step: 2, duration: { ar: 'أسبوع ٢–٤', en: 'Weeks 2–4' } },
          title: { ar: 'تصميم', en: 'Design' },
          body: {
            ar: 'تجربةٌ وواجهاتٌ تراها وتعتمدها قبل أن نكتب سطرًا واحدًا.',
            en: 'Experience and interfaces you see and approve before a line is written.',
          },
        },
        {
          type: 'step',
          data: { step: 3, duration: { ar: 'على مراحل', en: 'In phases' } },
          title: { ar: 'تطوير', en: 'Build' },
          body: {
            ar: 'بناءٌ مرحليٌّ يُراجَع كل أسبوع — تقدّمٌ تراه، لا وعودٌ تنتظرها.',
            en: 'Phased build reviewed every week — progress you watch, not promises you wait on.',
          },
        },
        {
          type: 'step',
          data: {
            step: 4,
            duration: { ar: 'ثم نبقى معك', en: 'Then we stay' },
          },
          title: { ar: 'إطلاق', en: 'Launch' },
          body: {
            ar: 'نُطلق على السحابة، ثم نبقى للمراقبة والتطوير والدعم.',
            en: 'We launch to the cloud, then stay for monitoring, iteration and support.',
          },
        },
        // "ماذا تستلم" deliverables per phase, joined by data.step (WEB1)
        {
          type: 'feature',
          data: { step: 1 },
          title: {
            ar: 'خريطة نطاقٍ ومراحل مُسعّرة',
            en: 'A priced scope-and-phase map',
          },
        },
        {
          type: 'feature',
          data: { step: 1 },
          title: {
            ar: 'جدولٌ زمنيٌّ تلتزم به الفرق',
            en: 'A timeline the teams commit to',
          },
        },
        {
          type: 'feature',
          data: { step: 2 },
          title: {
            ar: 'نماذج تفاعلية قابلة للنقر',
            en: 'Clickable interactive prototypes',
          },
        },
        {
          type: 'feature',
          data: { step: 2 },
          title: {
            ar: 'هويةُ واجهاتٍ تعتمدها قبل البناء',
            en: 'A UI identity you approve before build',
          },
        },
        {
          type: 'feature',
          data: { step: 3 },
          title: {
            ar: 'نسخةٌ تجريبية تعمل بعد كل مرحلة',
            en: 'A working build after every phase',
          },
        },
        {
          type: 'feature',
          data: { step: 3 },
          title: {
            ar: 'اجتماعُ متابعةٍ أسبوعيٌّ ثابت',
            en: 'A fixed weekly progress meeting',
          },
        },
        {
          type: 'feature',
          data: { step: 4 },
          title: {
            ar: 'إطلاقٌ سحابيٌّ بمراقبةٍ ونسخٍ احتياطي',
            en: 'A cloud launch with monitoring and backups',
          },
        },
        {
          type: 'feature',
          data: { step: 4 },
          title: {
            ar: 'عقدُ دعمٍ وتطويرٍ مستمر',
            en: 'An ongoing support and iteration contract',
          },
        },
      ],
    },
    {
      // The WEB10 works orbit — case-study cards hydrated from the `portfolio` collection
      // (no blocks; `config` unset → `all` mode, limit 6 in the content-service hydrator).
      type: 'work',
      eyebrow: { ar: '٠٤ · أعمالنا', en: '04 · OUR WORK' },
      title: {
        ar: 'أعمالٌ تتحدّث بالأرقام',
        en: 'Work that speaks in numbers',
      },
      subtitle: {
        ar: 'مشاريع أطلقناها لعملاء حقيقيين — ونتائجها قابلة للقياس.',
        en: 'Projects we shipped for real clients — with measurable results.',
      },
      blocks: [],
    },
    {
      type: 'stats',
      eyebrow: { ar: '٠٥ · بالأرقام', en: '05 · TELEMETRY' },
      title: { ar: 'أرقامٌ تختصر الرحلة', en: 'The numbers behind the voyage' },
      blocks: [
        {
          type: 'stat',
          data: { value: 120, suffix: '+' },
          title: { ar: 'مشروع مُسلَّم', en: 'Projects delivered' },
          body: { ar: 'عبر خمسة مجالات', en: 'Across five domains' },
        },
        {
          type: 'stat',
          data: { value: 60, suffix: '+' },
          title: { ar: 'عميل يثق بنا', en: 'Clients who trust us' },
          body: { ar: 'أغلبهم عملاءُ عودة', en: 'Most of them return' },
        },
        {
          type: 'stat',
          data: { value: 8, suffix: '' },
          title: { ar: 'سنوات خبرة', en: 'Years of experience' },
          body: { ar: 'منذ ٢٠١٨', en: 'Since 2018' },
        },
        {
          type: 'stat',
          data: { value: 98, suffix: '%' },
          title: { ar: 'نسبة الرضا', en: 'Satisfaction rate' },
          body: { ar: 'من استبيانات التسليم', en: 'From delivery surveys' },
        },
      ],
    },
    {
      // The received-transmissions wall — testimonials hydrated from the `testimonials`
      // collection (no blocks; `config` unset → `all` mode, limit 4 in the hydrator).
      type: 'testimonials',
      eyebrow: { ar: '٠٦ · إشاراتٌ واردة', en: '06 · TRANSMISSIONS' },
      title: {
        ar: 'ماذا يقول شركاؤنا بعد الإطلاق',
        en: 'What our partners say after launch',
      },
      blocks: [],
    },
    {
      // The ship's-log teaser — latest posts hydrated from the `blog` collection
      // (no blocks; `config` unset → `all` mode, limit 3, published-only on the public path).
      type: 'blog',
      eyebrow: { ar: '٠٧ · سجل الرحلة', en: '07 · SHIP’S LOG' },
      title: { ar: 'ممّا نتعلّمه ونحن نبني', en: 'What we learn as we build' },
      blocks: [],
    },
    {
      type: 'cta',
      eyebrow: { ar: 'الطبقة الأخيرة — الإطلاق', en: 'FINAL LAYER — LAUNCH' },
      title: {
        ar: 'جاهزون لنَسنِدَ مشروعك القادم',
        en: 'Ready to back your next project',
      },
      subtitle: {
        ar: 'ابدأ بمكالمةٍ قصيرة، ونرسم معًا خريطة المراحل.',
        en: "Start with a short call and we'll map the phases together.",
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
        // "ماذا يحدث بعد رسالتك" — the friction-killing next-steps sequence
        {
          type: 'feature',
          data: { slot: 'step' },
          title: {
            ar: 'مكالمةُ اكتشافٍ قصيرة نفهم فيها فكرتك وهدفك',
            en: 'A short discovery call — your idea and your goal',
          },
        },
        {
          type: 'feature',
          data: { slot: 'step' },
          title: {
            ar: 'نرسم النطاق ونقسّمه مراحل، بتكلفةٍ وجدولٍ واضحَين',
            en: 'We map the scope into phases, with clear cost and timeline',
          },
        },
        {
          type: 'feature',
          data: { slot: 'step' },
          title: {
            ar: 'نبدأ المرحلة الأولى — وترى تقدّمها كلَّ أسبوع',
            en: 'We start phase one — and you watch it progress every week',
          },
        },
      ],
    },
  ],
};

/**
 * Legal pages (P8.E-4) — seeded CMS page trees rendered by the website's `[...slug]` catch-all in
 * the `ambient` system (no bespoke route). Each topic is a `richtext` section whose block `body`
 * holds sanitized HTML prose (bilingual). This is a clear, honest baseline — the owner should have
 * it reviewed by counsel before relying on it legally (noted in PROGRESS).
 */
const PRIVACY: SeedPage = {
  slug: 'privacy',
  title: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
  metaTitle: {
    ar: 'سياسة الخصوصية — سَنَد التقنية',
    en: 'Privacy Policy — Sanad Tech',
  },
  metaDescription: {
    ar: 'كيف نجمع بياناتك ونستخدمها ونحميها في سَنَد التقنية.',
    en: 'How Sanad Tech collects, uses and protects your data.',
  },
  sections: [
    {
      type: 'richtext',
      eyebrow: { ar: 'الخصوصية', en: 'PRIVACY' },
      title: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
      subtitle: {
        ar: 'نحترم خصوصيتك، ولا نجمع من بياناتك إلا ما نحتاجه لخدمتك. توضّح هذه الصفحة ما نجمعه وكيف نستخدمه.',
        en: 'We respect your privacy and collect only the data we need to serve you. This page explains what we collect and how we use it.',
      },
      blocks: [],
    },
    {
      type: 'richtext',
      title: { ar: 'ما الذي نجمعه', en: 'What we collect' },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>عندما تتواصل معنا عبر نموذج الموقع، نجمع الاسم والبريد الإلكتروني ورقم الهاتف (اختياري) وتفاصيل رسالتك. كما نجمع بياناتٍ فنيةً محدودة (مثل نوع المتصفّح والصفحات المُزارة) لتشغيل الموقع وتحسينه.</p>',
            en: '<p>When you contact us through the website form, we collect your name, email, phone (optional) and the details of your message. We also collect limited technical data (such as browser type and pages visited) to operate and improve the site.</p>',
          },
        },
      ],
    },
    {
      type: 'richtext',
      title: { ar: 'كيف نستخدم بياناتك', en: 'How we use your data' },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>نستخدم بياناتك للردّ على استفسارك، وتقديم خدماتنا والتواصل معك بشأن مشروعك. لا نبيع بياناتك، ولا نشاركها إلا مع مزوّدي الخدمات الضروريين لتشغيل أعمالنا، وبالقدر اللازم فقط.</p>',
            en: '<p>We use your data to respond to your enquiry, deliver our services and communicate with you about your project. We do not sell your data, and we share it only with the service providers necessary to run our business, and only as far as needed.</p>',
          },
        },
      ],
    },
    {
      type: 'richtext',
      title: {
        ar: 'الاحتفاظ بالبيانات وحقوقك',
        en: 'Retention and your rights',
      },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>نحتفظ ببياناتك ما دامت لازمةً للغرض الذي جُمعت من أجله أو حسبما يقتضيه القانون. يحقّ لك طلب الاطّلاع على بياناتك أو تصحيحها أو حذفها في أيّ وقت بمراسلتنا.</p>',
            en: '<p>We keep your data for as long as it is needed for the purpose it was collected, or as required by law. You may request access to, correction of, or deletion of your data at any time by contacting us.</p>',
          },
        },
      ],
    },
    {
      type: 'richtext',
      title: { ar: 'تواصل معنا', en: 'Contact us' },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>لأيّ سؤالٍ يتعلّق بالخصوصية أو بيانات تخصّك، راسلنا على <a href="mailto:hello@sanad.tech">hello@sanad.tech</a>.</p>',
            en: '<p>For any question about privacy or your data, email us at <a href="mailto:hello@sanad.tech">hello@sanad.tech</a>.</p>',
          },
        },
      ],
    },
  ],
};

const TERMS: SeedPage = {
  slug: 'terms',
  title: { ar: 'شروط الاستخدام', en: 'Terms of Service' },
  metaTitle: {
    ar: 'شروط الاستخدام — سَنَد التقنية',
    en: 'Terms of Service — Sanad Tech',
  },
  metaDescription: {
    ar: 'الشروط التي تحكم استخدام موقع سَنَد التقنية والتعامل مع خدماتنا.',
    en: 'The terms governing use of the Sanad Tech website and engagement of our services.',
  },
  sections: [
    {
      type: 'richtext',
      eyebrow: { ar: 'الشروط', en: 'TERMS' },
      title: { ar: 'شروط الاستخدام', en: 'Terms of Service' },
      subtitle: {
        ar: 'باستخدامك هذا الموقع أو تعاملك مع خدماتنا فإنك توافق على الشروط التالية.',
        en: 'By using this website or engaging our services, you agree to the following terms.',
      },
      blocks: [],
    },
    {
      type: 'richtext',
      title: { ar: 'استخدام الموقع', en: 'Use of the site' },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>يُقدَّم محتوى هذا الموقع لأغراض التعريف بخدماتنا. توافق على عدم إساءة استخدام الموقع أو محاولة تعطيله أو الوصول إليه بطريقةٍ غير مصرّح بها.</p>',
            en: '<p>The content on this website is provided to introduce our services. You agree not to misuse the site, attempt to disrupt it, or access it in any unauthorized way.</p>',
          },
        },
      ],
    },
    {
      type: 'richtext',
      title: { ar: 'المشاريع والتسليمات', en: 'Projects and deliverables' },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>يُحكَم أيّ مشروعٍ نُنفّذه لك باتفاقيةٍ مكتوبةٍ منفصلة تحدّد النطاق والمراحل والتسليمات والتكلفة. نعمل على مراحل واضحة، ونعتمد كلَّ مرحلةٍ معك قبل الانتقال إلى التالية.</p>',
            en: '<p>Any project we deliver for you is governed by a separate written agreement that defines scope, phases, deliverables and cost. We work in clear phases and approve each phase with you before moving to the next.</p>',
          },
        },
      ],
    },
    {
      type: 'richtext',
      title: {
        ar: 'الملكية الفكرية والدفع',
        en: 'Intellectual property and payment',
      },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>تنتقل ملكية التسليمات إليك وفق ما تنصّ عليه الاتفاقية وبعد سداد المستحقّات المتّفق عليها. تبقى أدواتنا ومكوّناتنا العامّة القابلة لإعادة الاستخدام ملكًا لنا.</p>',
            en: '<p>Ownership of deliverables transfers to you as set out in the agreement and after the agreed fees are paid. Our reusable general tools and components remain ours.</p>',
          },
        },
      ],
    },
    {
      type: 'richtext',
      title: { ar: 'حدود المسؤولية والتعديلات', en: 'Liability and changes' },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>نبذل جهدنا المهنيّ في كل ما نقدّمه، دون ضمانٍ بأن يكون الموقع خاليًا من الأخطاء أو متاحًا دائمًا. قد نُحدّث هذه الشروط من وقتٍ لآخر، ويسري التحديث فور نشره على هذه الصفحة.</p>',
            en: '<p>We apply our professional care to everything we provide, without guaranteeing that the site is error-free or always available. We may update these terms from time to time, and an update takes effect once published on this page.</p>',
          },
        },
      ],
    },
    {
      type: 'richtext',
      title: { ar: 'تواصل معنا', en: 'Contact us' },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>لأيّ سؤالٍ عن هذه الشروط، راسلنا على <a href="mailto:hello@sanad.tech">hello@sanad.tech</a>.</p>',
            en: '<p>For any question about these terms, email us at <a href="mailto:hello@sanad.tech">hello@sanad.tech</a>.</p>',
          },
        },
      ],
    },
  ],
};

/**
 * About page (Phase 5) — a seeded, editable CMS page tree that replaces the hardcoded `/about`
 * route. `hero`/`richtext`(story)/`richtext`(values)/`cta` carry inline copy + blocks; the `team`
 * section carries no blocks and hydrates the `team_member` collection in-service (mode `all`).
 * Copy byte-sourced from the website's `ABOUT_COPY` (no regression). Story/values prose is authored
 * as `richtext` blocks (trusted HTML), the Quill-block authoring model.
 */
const ABOUT: SeedPage = {
  slug: 'about',
  title: { ar: 'من نحن', en: 'About' },
  metaTitle: { ar: 'من نحن — سَنَد التقنية', en: 'About — Sanad Tech' },
  metaDescription: {
    ar: '«سَنَد» تعني الدعم والإسناد — نُسنِدُ الفِرَق التي تبني الغد، ونُكمل معها الطريق بعد الإطلاق.',
    en: '"Sanad" means backing — we back the teams building tomorrow and stay with them after launch.',
  },
  sections: [
    {
      // a marketing-page hero band — the generic `richtext` section (head + a CTA-button block).
      // NOT the landing `hero` type, whose shared component carries landing-specific chrome
      // (two fixed CTAs, cosmos veil, proof strip). Phase 5.
      type: 'richtext',
      eyebrow: { ar: 'من نحن', en: 'About us' },
      title: {
        ar: 'نَسنِدُ الفِرَقَ التي تبني الغد',
        en: 'We back the teams building tomorrow',
      },
      subtitle: {
        ar: '«سَنَد» تعني الدعم والإسناد. وُجِدنا لنكون الكتف الذي تتّكئ عليه الفِرَق وهي تُطلق منتجاتها — ونُكمل معها الطريق بعد الإطلاق.',
        en: '"Sanad" means backing. We exist to be the shoulder teams lean on as they ship — and to keep walking the road with them after launch.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'تواصل معنا', en: 'Get in touch' },
        },
      ],
    },
    {
      type: 'richtext',
      eyebrow: { ar: 'الحكاية', en: 'Our story' },
      title: {
        ar: 'بدأنا من سؤال: لماذا يُسلَّم البرنامج ثم يُترَك؟',
        en: 'We started from one question: why is software handed over, then abandoned?',
      },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>رأينا فِرَقًا تدفع الكثير مقابل نظامٍ يصلها ناقصًا، بلا متابعةٍ بعد الإطلاق. فاخترنا طريقةً مختلفة: مراحل واضحة، تسليمٌ يُراجَع ويُعتمَد، واجتماعٌ أسبوعيٌّ يُبقي الجميع على المسار نفسه.</p><p>اليوم نُسنِدُ فِرَقًا في المنطقة — من الشركات الناشئة إلى المؤسسات — ونبقى معها حتى بعد أن يُضيء المنتج.</p>',
            en: '<p>We watched teams pay dearly for systems that arrived incomplete, with no follow-through after launch. So we chose a different way: clear phases, deliverables you review and approve, and a weekly meeting that keeps everyone on the same track.</p><p>Today we back teams across the region — from startups to enterprises — and stay with them long after the product goes live.</p>',
          },
        },
      ],
    },
    {
      type: 'richtext',
      eyebrow: { ar: 'ما يقودنا', en: 'What drives us' },
      title: {
        ar: 'ثلاثُ قِيَمٍ نَزِنُ بها كلَّ قرار',
        en: 'Three values behind every decision',
      },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<h3>الثِّقة</h3><p>شفافيةٌ كاملة في كل مرحلة: تعرف أين وصل مشروعك، وما القادم، ومن يعمل عليه — بلا مفاجآت.</p><h3>الإتقان</h3><p>كودٌ نظيف، بنيةٌ قابلة للتوسّع، واختبارٌ قبل كل تسليم. نبني لِيُعمَّر، لا لِيُرمَّم.</p><h3>الحِرفة</h3><p>نهتمّ بالتفصيل الصغير: حركةٌ سلسة، واجهةٌ تحترم لغتك، وتجربةٌ تُشعِر مستخدميك أنهم في أيدٍ أمينة.</p>',
            en: '<h3>Trust</h3><p>Full transparency at every phase: you know where your project stands, what’s next, and who’s on it — no surprises.</p><h3>Mastery</h3><p>Clean code, scalable architecture, tested before every delivery. We build to last, not to patch.</p><h3>Craft</h3><p>We sweat the details: fluid motion, an interface that respects your language, an experience that tells users they’re in safe hands.</p>',
          },
        },
      ],
    },
    {
      type: 'team',
      eyebrow: { ar: 'الفريق', en: 'The team' },
      title: {
        ar: 'عقولٌ تعمل في اتّجاهٍ واحد',
        en: 'Minds pulling in one direction',
      },
      blocks: [],
    },
    {
      // the closing CTA band — the generic `richtext` section (head + a CTA-button block), NOT the
      // landing `cta` type (whose component carries landing steps + cosmos backdrop). Phase 5.
      type: 'richtext',
      title: {
        ar: 'هل نَبني نظامك التالي معًا؟',
        en: 'Shall we build your next system together?',
      },
      subtitle: {
        ar: 'ابدأ بمكالمةٍ قصيرة، ودَعنا نرسم لك خريطة المراحل.',
        en: 'Start with a short call and let us map the phases for you.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/request-a-project', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
      ],
    },
  ],
};

/**
 * FAQ page (Phase 5) — a seeded, editable CMS page tree that replaces the hardcoded `/faq` route.
 * `hero`/`cta` carry inline copy + blocks; the `faq` section carries no blocks and hydrates the
 * `faq` collection in-service (mode `all`). Copy byte-sourced from the website's `FAQ_COPY`.
 */
const FAQ: SeedPage = {
  slug: 'faq',
  title: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
  metaTitle: { ar: 'الأسئلة الشائعة — سَنَد التقنية', en: 'FAQ — Sanad Tech' },
  metaDescription: {
    ar: 'كل ما تريد معرفته عن كيفية عملنا، التكلفة، والدعم بعد الإطلاق.',
    en: 'Everything you want to know about how we work, pricing, and support after launch.',
  },
  sections: [
    {
      // marketing-page hero band as a generic `richtext` section (head + CTA-button block). Phase 5.
      type: 'richtext',
      eyebrow: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
      title: {
        ar: 'أسئلةٌ نُسأل عنها كثيرًا',
        en: 'Questions we’re often asked',
      },
      subtitle: {
        ar: 'كل ما تريد معرفته عن كيفية عملنا، التكلفة، والدعم بعد الإطلاق — وإن بقي سؤال، نحن قريبون.',
        en: 'Everything you want to know about how we work, pricing, and support after launch — and if a question remains, we’re close by.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'تواصل معنا', en: 'Talk to us' },
        },
      ],
    },
    {
      type: 'faq',
      eyebrow: { ar: '٠١ · الأسئلة', en: '01 · QUESTIONS' },
      title: { ar: 'إجاباتٌ مباشرة', en: 'Straight answers' },
      blocks: [],
    },
    {
      // the closing CTA band as a generic `richtext` section (head + CTA-button block). Phase 5.
      type: 'richtext',
      eyebrow: { ar: 'ما زال لديك سؤال؟', en: 'STILL HAVE A QUESTION?' },
      title: { ar: 'لم تجد إجابتك؟', en: 'Didn’t find your answer?' },
      subtitle: {
        ar: 'اسألنا مباشرة — نردّ بوضوح ودون التزام.',
        en: 'Ask us directly — we answer clearly, with no obligation.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'اسأل فريقنا', en: 'Ask our team' },
        },
      ],
    },
  ],
};

/**
 * Process page (Phase 5, hybrid) — the editable hero + closing-CTA bands for `/process`; the
 * phases-timeline / weekly-meeting / post-launch body stays a coded website component (no CMS
 * entity for the phased-delivery method). Both bands are generic `richtext` sections (NOT the
 * landing `hero`/`cta`, whose components carry landing chrome). Copy byte-sourced from the
 * website's `PROCESS_COPY` (F7 — the coded fallback matches).
 */
const PROCESS: SeedPage = {
  slug: 'process',
  title: { ar: 'آلية العمل', en: 'How we work' },
  metaTitle: {
    ar: 'آلية العمل — سَنَد التقنية',
    en: 'How we work — Sanad Tech',
  },
  metaDescription: {
    ar: 'لا مفاجآت ولا غموض. نُسلّم في كل مرحلة شيئًا تراه وتعتمده، باجتماعٍ أسبوعيٍّ يُبقيك على المسار من أول فكرة إلى ما بعد الإطلاق.',
    en: 'No surprises, no guesswork. Each phase delivers something you see and approve, with a weekly meeting that keeps you on track from the first idea to well after launch.',
  },
  sections: [
    {
      type: 'richtext',
      eyebrow: { ar: 'آلية العمل', en: 'How we work' },
      title: {
        ar: 'مسارٌ واضح، مرحلةً تلو الأخرى',
        en: 'A clear path, phase by phase',
      },
      subtitle: {
        ar: 'لا مفاجآت ولا غموض. نُسلّم في كل مرحلة شيئًا تراه وتعتمده، باجتماعٍ أسبوعيٍّ يُبقيك على المسار من أول فكرة إلى ما بعد الإطلاق.',
        en: 'No surprises, no guesswork. Each phase delivers something you see and approve, with a weekly meeting that keeps you on track from the first idea to well after launch.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/request-a-project', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
      ],
    },
    {
      type: 'richtext',
      title: {
        ar: 'جاهزون نرسم لك المرحلة الأولى؟',
        en: 'Ready to map your first phase?',
      },
      subtitle: {
        ar: 'ابدأ بمكالمةٍ قصيرة، ودَعنا نحدّد النطاق والخريطة الزمنية.',
        en: 'Start with a short call and let us define the scope and timeline.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/request-a-project', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
      ],
    },
  ],
};

/**
 * Portfolio index page (Phase 5, hybrid) — the editable hero + closing-CTA bands for `/portfolio`;
 * the full filtered case-study gallery stays a DB-driven website component (the published
 * `portfolio_project` entities). Copy byte-sourced from the website's `PORTFOLIO_COPY`.
 */
const PORTFOLIO: SeedPage = {
  slug: 'portfolio',
  title: { ar: 'أعمالنا', en: 'Work' },
  metaTitle: { ar: 'أعمالنا — سَنَد التقنية', en: 'Work — Sanad Tech' },
  metaDescription: {
    ar: 'كلُّ مشروعٍ تحدٍّ فهمناه، وحلٌّ بنيناه، ونتيجةٌ قِسناها. اختر عملًا لتقرأ قصّته كاملة.',
    en: 'Each project is a challenge we understood, a solution we built, and a result we measured. Pick one to read its full story.',
  },
  sections: [
    {
      type: 'richtext',
      eyebrow: { ar: 'أعمالنا', en: 'Selected work' },
      title: {
        ar: 'أنظمةٌ أطلقناها، ونتائجُ نفخر بها',
        en: 'Systems we shipped, outcomes we stand by',
      },
      subtitle: {
        ar: 'كلُّ مشروعٍ تحدٍّ فهمناه، وحلٌّ بنيناه، ونتيجةٌ قِسناها. اختر عملًا لتقرأ قصّته كاملة.',
        en: 'Each project is a challenge we understood, a solution we built, and a result we measured. Pick one to read its full story.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/request-a-project', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
      ],
    },
    {
      type: 'richtext',
      eyebrow: { ar: 'لنبدأ', en: 'LET’S BEGIN' },
      title: {
        ar: 'مشروعك القادم قد يكون قصّتنا التالية',
        en: 'Your next project could be our next story',
      },
      subtitle: {
        ar: 'احجز مكالمةً قصيرة ونرسم معًا أنسب مسار.',
        en: 'Book a short call and we’ll map the right path together.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/request-a-project', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
      ],
    },
  ],
};

/**
 * Services index page (Phase 5, hybrid) — the editable hero + closing-CTA bands for `/services`;
 * the core-services grid + supporting/method/tech bands stay a website component (the CMS
 * `service` entities feed the grid). Copy byte-sourced from the website's `SERVICES_COPY`.
 */
const SERVICES_PAGE: SeedPage = {
  slug: 'services',
  title: { ar: 'خدماتنا', en: 'Services' },
  metaTitle: { ar: 'خدماتنا — سَنَد التقنية', en: 'Services — Sanad Tech' },
  metaDescription: {
    ar: 'من المنصّة إلى الجوال إلى البنية الخلفية، فريقٌ واحدٌ يحمل مشروعك ثم يبقى معك. اختر القدرة لتغوص في تفاصيلها.',
    en: 'From platform to mobile to backend, one team carries your project — then stays with you. Pick a capability to go deeper.',
  },
  sections: [
    {
      type: 'richtext',
      eyebrow: { ar: 'خدماتنا', en: 'Our services' },
      title: {
        ar: 'قدرةٌ واحدة متكاملة، من الفكرة إلى ما بعد الإطلاق',
        en: 'One integrated capability — from idea to beyond launch',
      },
      subtitle: {
        ar: 'من المنصّة إلى الجوال إلى البنية الخلفية، فريقٌ واحدٌ يحمل مشروعك ثم يبقى معك. اختر القدرة لتغوص في تفاصيلها.',
        en: 'From platform to mobile to backend, one team carries your project — then stays with you. Pick a capability to go deeper.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'تواصل معنا', en: 'Get in touch' },
        },
      ],
    },
    {
      type: 'richtext',
      eyebrow: { ar: 'لنبدأ', en: 'LET’S BEGIN' },
      title: {
        ar: 'لكلِّ فكرةٍ مسارُها. أيُّها يخدم مشروعك؟',
        en: 'Every idea has its path. Which one serves yours?',
      },
      subtitle: {
        ar: 'احجز مكالمةً قصيرة ونرسم معًا أنسب مسار.',
        en: 'Book a short call and we’ll map the right path together.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'تواصل معنا', en: 'Get in touch' },
        },
      ],
    },
  ],
};

/**
 * Blog index page (Phase 5, hybrid) — the editable hero + closing-CTA bands for `/blog`; the full
 * filtered article list stays a DB-driven website component (the published `blog_post` entities).
 * Copy byte-sourced from the website's `BLOG_COPY`.
 */
const BLOG: SeedPage = {
  slug: 'blog',
  title: { ar: 'المدوّنة', en: 'Blog' },
  metaTitle: { ar: 'المدوّنة — سَنَد التقنية', en: 'Blog — Sanad Tech' },
  metaDescription: {
    ar: 'نكتب عمّا نتعلّمه ونحن نبني: كيف نُسلّم على مراحل، كيف نصنع القرارات، وكيف نبقى معك بعد الإطلاق.',
    en: 'We write about what we learn as we build: how we deliver in phases, how we make decisions, and how we stay with you after launch.',
  },
  sections: [
    {
      type: 'richtext',
      eyebrow: { ar: 'المدوّنة', en: 'Writing' },
      title: { ar: 'أفكارٌ من ورشة العمل', en: 'Notes from the workshop' },
      subtitle: {
        ar: 'نكتب عمّا نتعلّمه ونحن نبني: كيف نُسلّم على مراحل، كيف نصنع القرارات، وكيف نبقى معك بعد الإطلاق.',
        en: 'We write about what we learn as we build: how we deliver in phases, how we make decisions, and how we stay with you after launch.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/request-a-project', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
      ],
    },
    {
      type: 'richtext',
      eyebrow: { ar: 'لنبدأ', en: 'LET’S BEGIN' },
      title: {
        ar: 'عندك فكرةٌ تستحق أن تُبنى؟',
        en: 'Have an idea worth building?',
      },
      subtitle: {
        ar: 'احجز مكالمةً قصيرة ونرسم معًا أنسب مسار.',
        en: 'Book a short call and we’ll map the right path together.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/request-a-project', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
      ],
    },
  ],
};

/**
 * Careers page (Phase 5, FULL CMS) — a seeded, editable page tree that replaces the hardcoded
 * `/careers` route. Four generic `richtext` bands: hero + culture + openings + a closing CTA. There
 * is no jobs entity yet (a structured openings model is deferred to the HR service, P12), so the
 * culture cards + openings copy are authored as `richtext` prose blocks (trusted HTML — the Quill
 * authoring model), fully editable in the studio (the coded `CareersIndex` card grid was retired,
 * mirroring how `/about` retired `AboutIndex` for editable `values` prose). Copy byte-sourced from
 * the website's `CAREERS_COPY` (F7 — the coded fallback matches). Since there is no lead form on
 * careers, both the hero and the closing band route to `/contact`.
 */
const CAREERS: SeedPage = {
  slug: 'careers',
  title: { ar: 'انضم إلينا', en: 'Careers' },
  metaTitle: { ar: 'انضم إلينا — سَنَد التقنية', en: 'Careers — Sanad Tech' },
  metaDescription: {
    ar: 'نحن فريقٌ صغير يهتمّ بالحِرفة والأثر — نبني منتجاتٍ حقيقية لعملاء حقيقيين، ونتعلّم في كل مرحلة.',
    en: 'We’re a small team that cares about craft and impact — we build real products for real clients, and learn at every phase.',
  },
  sections: [
    {
      type: 'richtext',
      eyebrow: { ar: 'انضم إلينا', en: 'Join us' },
      title: { ar: 'ابنِ معنا ما يدوم', en: 'Build things that last, with us' },
      subtitle: {
        ar: 'نحن فريقٌ صغير يهتمّ بالحِرفة والأثر — نبني منتجاتٍ حقيقية لعملاء حقيقيين، ونتعلّم في كل مرحلة.',
        en: 'We’re a small team that cares about craft and impact — we build real products for real clients, and learn at every phase.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'تعرّف علينا', en: 'Get to know us' },
        },
      ],
    },
    {
      type: 'richtext',
      eyebrow: { ar: 'ثقافتنا', en: 'Our culture' },
      title: { ar: 'كيف نعمل معًا', en: 'How we work together' },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<h3>حِرفةٌ قبل السرعة</h3><p>نكتب كودًا نظيفًا ونختبر قبل كل تسليم — لأن ما نبنيه يجب أن يُعمَّر، لا أن يُرمَّم.</p><h3>مسؤوليةٌ كاملة</h3><p>كلٌّ منّا يملك عمله من الفكرة إلى الإطلاق، ويتحدّث بلغة العميل لا بلغة التقنية وحدها.</p><h3>تعلّمٌ مستمر</h3><p>نراجع، نتشارك ما نتعلّمه، ونمنح بعضنا الوقت لنُتقن — النموّ جزءٌ من العمل، لا إضافةٌ عليه.</p>',
            en: '<h3>Craft before speed</h3><p>We write clean code and test before every delivery — what we build should last, not be patched.</p><h3>Full ownership</h3><p>Each of us owns their work from idea to launch, and speaks the client’s language, not only tech.</p><h3>Continuous learning</h3><p>We review, share what we learn, and give each other room to master the craft — growth is part of the work, not extra to it.</p>',
          },
        },
      ],
    },
    {
      type: 'richtext',
      eyebrow: { ar: 'الشواغر', en: 'Open roles' },
      title: {
        ar: 'لا توجد شواغر معلنة حاليًا',
        en: 'No open roles right now',
      },
      blocks: [
        {
          type: 'richtext',
          body: {
            ar: '<p>لكننا نسعد دائمًا بالتعرّف على أشخاصٍ موهوبين. إن رأيت نفسك معنا — مطوّرًا، مصمّمًا، أو مديرَ مشاريع — أرسل لنا أعمالك وسنبقى على تواصل حين يفتح دورٌ يناسبك.</p>',
            en: '<p>But we’re always glad to meet talented people. If you see yourself with us — as a developer, designer, or project manager — send us your work and we’ll stay in touch when a fitting role opens.</p>',
          },
        },
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'أرسل أعمالك', en: 'Send us your work' },
        },
      ],
    },
    {
      type: 'richtext',
      title: { ar: 'مستعدٌّ للحديث؟', en: 'Ready to talk?' },
      subtitle: {
        ar: 'تواصل معنا وأخبرنا بما تحبّ أن تبنيه.',
        en: 'Reach out and tell us what you’d love to build.',
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'تواصل معنا', en: 'Get in touch' },
        },
      ],
    },
  ],
};

/**
 * Contact page (Phase 5, CMS chrome) — a single editable `richtext` hero band above the KEPT
 * bespoke `LeadForm` (the form → server action → `POST /leads` → `lead.created` path is untouched).
 * No CTA block + no closing band: the form is the conversion point. Copy byte-sourced from the
 * website's `CONTACT_COPY` (transcribed from the i18n `dict.contact`, F7).
 */
const CONTACT: SeedPage = {
  slug: 'contact',
  title: { ar: 'تواصل معنا', en: 'Contact' },
  metaTitle: { ar: 'تواصل معنا — سَنَد التقنية', en: 'Contact — Sanad Tech' },
  metaDescription: {
    ar: 'احكِ لنا عن مشروعك وسنعاود التواصل معك.',
    en: 'Tell us about your project and we will get back to you.',
  },
  sections: [
    {
      type: 'richtext',
      eyebrow: { ar: 'تواصل معنا', en: 'Contact' },
      title: { ar: 'لنبدأ الحديث', en: 'Let’s talk' },
      subtitle: {
        ar: 'احكِ لنا عن مشروعك وسنعاود التواصل معك.',
        en: 'Tell us about your project and we will get back to you.',
      },
      blocks: [],
    },
  ],
};

/**
 * Request-a-project page (Phase 5, CMS chrome) — a single editable `richtext` hero band above the
 * KEPT bespoke multi-step `RequestForm` (the flagship conversion surface; the lead path is
 * untouched). No CTA block + no closing band: the wizard is the conversion. Copy byte-sourced from
 * the website's `REQUEST_COPY.hero` (F7).
 */
const REQUEST_A_PROJECT: SeedPage = {
  slug: 'request-a-project',
  title: { ar: 'ابدأ مشروعك', en: 'Start a project' },
  metaTitle: {
    ar: 'ابدأ مشروعك — سَنَد التقنية',
    en: 'Start a project — Sanad Tech',
  },
  metaDescription: {
    ar: 'ثلاث خطوات قصيرة تُعرِّفنا بمشروعك، ونعود إليك بخريطة مراحل واضحة وخطوةٍ أولى.',
    en: 'Three short steps to tell us about your project — we come back with a clear phase map and a first step.',
  },
  sections: [
    {
      type: 'richtext',
      eyebrow: { ar: 'ابدأ مشروعك', en: 'Start a project' },
      title: {
        ar: 'لِنَبنِ مشروعك القادم، مرحلةً مرحلة',
        en: "Let's build your next project, phase by phase",
      },
      subtitle: {
        ar: 'ثلاث خطوات قصيرة تُعرِّفنا بمشروعك، ونعود إليك بخريطة مراحل واضحة وخطوةٍ أولى.',
        en: 'Three short steps to tell us about your project — we come back with a clear phase map and a first step.',
      },
      blocks: [],
    },
  ],
};

/** The pages seeded on first boot (landing + the P8.E-4 legal pages + the Phase-5 marketing pages). */
export const SEED_PAGES: readonly SeedPage[] = [
  LANDING,
  PRIVACY,
  TERMS,
  ABOUT,
  FAQ,
  PROCESS,
  PORTFOLIO,
  SERVICES_PAGE,
  BLOG,
  CAREERS,
  CONTACT,
  REQUEST_A_PROJECT,
];

/** The core services seeded on first boot (the `What we build` grid). */
export const SEED_SERVICES: readonly SeedService[] = [
  {
    slug: 'saas',
    category: 'core',
    iconKey: 'cloud',
    title: { ar: 'منصّات SaaS', en: 'SaaS platforms' },
    summary: {
      ar: 'منتجاتٌ سحابية متعددة المستأجرين، قابلة للتوسّع من أول عميلٍ إلى المليون.',
      en: 'Scalable multi-tenant cloud products, from first customer to millions.',
    },
  },
  {
    slug: 'mobile',
    category: 'core',
    iconKey: 'smartphone',
    title: { ar: 'تطبيقات الجوال', en: 'Mobile apps' },
    summary: {
      ar: 'تجارب أصيلة لـ iOS وأندرويد بأداءٍ سلس يعمل حتى دون اتصال.',
      en: 'Native-grade iOS & Android experiences that stay smooth, even offline.',
    },
  },
  {
    slug: 'lms',
    category: 'core',
    iconKey: 'graduation-cap',
    title: { ar: 'منصّات التعلّم LMS', en: 'Learning platforms (LMS)' },
    summary: {
      ar: 'مساراتٌ وتقييماتٌ وشهاداتٌ ومتابعةُ تقدّمٍ — للجامعات ومراكز التدريب.',
      en: 'Paths, assessments, certificates and progress tracking — for academies and enterprises.',
    },
  },
  {
    slug: 'erp',
    category: 'core',
    iconKey: 'layout-grid',
    title: { ar: 'أنظمة ERP', en: 'ERP systems' },
    summary: {
      ar: 'منظومةٌ واحدة تُدير الموارد والمخزون والمحاسبة والموارد البشرية.',
      en: 'One system to run resources, inventory, accounting and HR.',
    },
  },
];

/**
 * Default testimonials (managed from the admin portal — placeholder names, real bilingual
 * voice) so the landing `testimonials` section is never blank (U9 / WEB1). Author names are
 * non-translatable proper nouns; quote/role/descriptor localize.
 */
export const SEED_TESTIMONIALS: readonly SeedTestimonial[] = [
  {
    authorName: 'Layla Mansour',
    companyName: 'Tadawul Pay',
    featured: true,
    rating: 5,
    quote: {
      ar: 'سَنَد لم يُسلّمنا نظامًا فحسب، بل بقي سَنَدَنا بعد الإطلاق. كل مرحلة كانت واضحة، وكل وعدٍ تحقّق.',
      en: "Sanad didn't just hand us a system — they stayed our backing after launch. Every phase was clear, every promise kept.",
    },
    authorRole: { ar: 'الرئيسة التنفيذية', en: 'Chief Executive Officer' },
    companyDescriptor: { ar: 'منصّة مدفوعات', en: 'Payments platform' },
  },
  {
    authorName: 'Khalid Otaibi',
    companyName: 'Masar Logistics',
    featured: true,
    rating: 5,
    quote: {
      ar: 'الاجتماع الأسبوعي غيّر علاقتنا بالتطوير — صرنا نرى التقدّم بأعيننا، لا ننتظره.',
      en: 'The weekly meeting changed our relationship with development — we watched progress instead of waiting for it.',
    },
    authorRole: { ar: 'مدير العمليات', en: 'Operations Director' },
    companyDescriptor: { ar: 'شركة لوجستيات', en: 'Logistics company' },
  },
  {
    authorName: 'Dr. Salma Haddad',
    companyName: 'Riaya Health',
    featured: false,
    rating: 5,
    quote: {
      ar: 'أطلقنا منصّة رعاية على مراحل، وكانت كل مرحلة تعمل فعلًا قبل أن ندفع للتي بعدها — هذا ما بنى الثقة.',
      en: 'We launched Riaya in phases, and every phase actually worked before we paid for the next — that is what built the trust.',
    },
    authorRole: { ar: 'المديرة الطبية', en: 'Medical Director' },
    companyDescriptor: { ar: 'منصّة صحة رقمية', en: 'Digital-health platform' },
  },
];

/**
 * Default team members (managed from the admin portal — placeholder names, the real `role.*`
 * labels from `content-defaults.md`) so the About grid is never blank (U9 / WEB1). name/role/
 * bio localize; `slug` is the unique key.
 */
export const SEED_TEAM_MEMBERS: readonly SeedTeamMember[] = [
  {
    slug: 'samer-al-hasan',
    featured: true,
    name: { ar: 'سامر الحسن', en: 'Samer Al-Hasan' },
    role: { ar: 'القائد التقني', en: 'Chief Technology Officer' },
    bio: {
      ar: 'يقود البنية التقنية ويضمن أن نبني لِيُعمَّر، لا لِيُرمَّم.',
      en: 'Leads the technical architecture and makes sure we build to last, not to patch.',
    },
  },
  {
    slug: 'layan-qasim',
    featured: true,
    name: { ar: 'ليان قاسم', en: 'Layan Qasim' },
    role: { ar: 'مديرة المنتج', en: 'Head of Product' },
    bio: {
      ar: 'تترجم أهداف العميل إلى مسارٍ واضح من المراحل والتسليمات.',
      en: "Turns each client's goals into a clear path of phases and deliverables.",
    },
  },
  {
    slug: 'yousef-murad',
    featured: true,
    name: { ar: 'يوسف مراد', en: 'Yousef Murad' },
    role: { ar: 'قائد الهندسة', en: 'Engineering Lead' },
    bio: {
      ar: 'يقود فريق الهندسة بكودٍ نظيف واختبارٍ قبل كل تسليم.',
      en: 'Leads the engineering team with clean code and tests before every delivery.',
    },
  },
  {
    slug: 'noor-al-ali',
    featured: true,
    name: { ar: 'نور العلي', en: 'Noor Al-Ali' },
    role: { ar: 'مديرة التصميم', en: 'Design Director' },
    bio: {
      ar: 'تصنع تجارب تحترم لغتك واتجاهك، وتُشعر مستخدميك أنهم في أيدٍ أمينة.',
      en: 'Crafts experiences that respect your language and direction and tell users they are in safe hands.',
    },
  },
];

/**
 * Default portfolio categories (the work-grid filter) from the `trust.domain.*` sectors. Real
 * case-study projects are admin-managed (seed 0 — `work.placeholderNote`), but the categories
 * seed so the filter is populated (U9 / WEB1).
 */
export const SEED_PORTFOLIO_CATEGORIES: readonly SeedPortfolioCategory[] = [
  { slug: 'payments', name: { ar: 'المدفوعات', en: 'Payments' } },
  { slug: 'commerce', name: { ar: 'التجارة', en: 'Commerce' } },
  { slug: 'logistics', name: { ar: 'اللوجستيات', en: 'Logistics' } },
  { slug: 'hr', name: { ar: 'الموارد البشرية', en: 'Human resources' } },
  { slug: 'health', name: { ar: 'الصحة الرقمية', en: 'Digital health' } },
];

/**
 * Default PUBLISHED case studies (U9 / WEB1) — the cards the landing's WEB10 orbiting-works
 * centerpiece renders. Mirrors the blog sample-post precedent: seeded so the public works
 * section is never empty, idempotent on `slug`, mapped onto the seeded categories above. An
 * admin edits/replaces them; existing rows are never overwritten. `result` is a single headline
 * metric the orbit card shows as a chip (Western digits).
 */
export const SEED_PORTFOLIO_PROJECTS: readonly SeedPortfolioProject[] = [
  {
    slug: 'raseed',
    categorySlug: 'payments',
    clientName: 'Tadawul Pay',
    featured: true,
    title: { ar: 'لوحة رصيد', en: 'Raseed dashboard' },
    summary: {
      ar: 'لوحةٌ ماليّة لحظيّة بمعالجةٍ آمنة للمعاملات.',
      en: 'A real-time finance dashboard with secure transaction processing.',
    },
    challenge: {
      ar: 'تقاريرُ متأخرة لم تواكب حجم المعاملات المتنامي.',
      en: 'Lagging reports that could not keep up with growing transaction volume.',
    },
    solution: {
      ar: 'لوحةٌ ماليّة لحظيّة متوافقة مع PCI بمعالجةٍ آمنة.',
      en: 'A PCI-compliant real-time finance dashboard with secure processing.',
    },
    result: { ar: '1.2M معاملة شهريًا', en: '1.2M transactions/month' },
  },
  {
    slug: 'wasla',
    categorySlug: 'commerce',
    clientName: 'Wasla Delivery',
    featured: true,
    title: { ar: 'تطبيق وصلة', en: 'Wasla app' },
    summary: {
      ar: 'تطبيقٌ موحّد للتوصيل بتتبّعٍ آنيّ ودفعٍ سلس.',
      en: 'A unified delivery app with live tracking and seamless payments.',
    },
    challenge: {
      ar: 'تجربة توصيلٍ مبعثرة عبر قنواتٍ متعددة.',
      en: 'A fragmented delivery experience spread across many channels.',
    },
    solution: {
      ar: 'تطبيقٌ موحّد بتتبّعٍ آنيّ ودفعٍ مدمج.',
      en: 'A single app with real-time tracking and built-in payments.',
    },
    result: { ar: '200K تنزيل', en: '200K downloads' },
  },
  {
    slug: 'masar',
    categorySlug: 'logistics',
    clientName: 'Masar Logistics',
    featured: false,
    title: { ar: 'نظام مسار', en: 'Masar system' },
    summary: {
      ar: 'نظام ERP يوحّد المخزون والأسطول والمالية.',
      en: 'An ERP that unifies inventory, fleet and finance.',
    },
    challenge: {
      ar: 'عمليّاتٌ يدوية بطيئة موزّعة على فروعٍ كثيرة.',
      en: 'Slow manual operations spread across many branches.',
    },
    solution: {
      ar: 'نظام ERP يوحّد المخزون والأسطول والمالية في لوحةٍ واحدة.',
      en: 'An ERP unifying inventory, fleet and finance in one console.',
    },
    result: { ar: '-45% زمن المعالجة', en: '−45% processing time' },
  },
  {
    slug: 'itqan',
    categorySlug: 'hr',
    clientName: 'Itqan HR',
    featured: false,
    title: { ar: 'منصّة إتقان', en: 'Itqan platform' },
    summary: {
      ar: 'منصّة تطويرٍ مهنيّ بمساراتٍ ومؤشّرات أداء.',
      en: 'A professional-development platform with tracks and performance metrics.',
    },
    challenge: {
      ar: 'تدريبٌ غير مُقاس لا يُترجَم إلى أثر.',
      en: 'Unmeasured training that never translated into impact.',
    },
    solution: {
      ar: 'منصّة تطويرٍ مهنيّ بمساراتٍ ومؤشّرات أداء واضحة.',
      en: 'A development platform with clear learning tracks and KPIs.',
    },
    result: { ar: '96% رضا', en: '96% satisfaction' },
  },
  {
    slug: 'riaya',
    categorySlug: 'health',
    clientName: 'Riaya Health',
    featured: true,
    title: { ar: 'منصّة رعاية', en: 'Riaya platform' },
    summary: {
      ar: 'منصّة رعايةٍ رقمية تربط المرضى بمقدّمي الخدمة.',
      en: 'A digital-care platform connecting patients with providers.',
    },
    challenge: {
      ar: 'وصولٌ محدود للرعاية خارج المراكز الكبرى.',
      en: 'Limited access to care outside major centres.',
    },
    solution: {
      ar: 'منصّة استشاراتٍ رقمية بحجزٍ ومتابعةٍ آمنة.',
      en: 'A telehealth platform with secure booking and follow-up.',
    },
    result: { ar: '+120% وصول للرعاية', en: '+120% care reach' },
  },
];

/** Default FAQs (managed from the admin portal) so the FAQ page is never blank (U9 / WEB1). */
export const SEED_FAQS: readonly SeedFaq[] = [
  {
    category: 'process',
    question: {
      ar: 'كيف تسير آلية العمل؟',
      en: 'How does your process work?',
    },
    answer: {
      ar: 'نعمل على مراحل واضحة — اكتشاف، تصميم، تطوير، إطلاق — ونلتقي أسبوعيًا لنُريك التقدّم ونأخذ اعتمادك قبل الانتقال للمرحلة التالية.',
      en: 'We work in clear phases — discovery, design, build, launch — and meet weekly to show you progress and get your approval before moving to the next phase.',
    },
  },
  {
    category: 'pricing',
    question: {
      ar: 'كيف تُحتسب التكلفة؟',
      en: 'How is pricing determined?',
    },
    answer: {
      ar: 'حسب نطاق المشروع وعدد المراحل. نتّفق على نطاق كل مرحلة وتكلفتها قبل أن نبدأها، فلا مفاجآت.',
      en: 'By project scope and the number of phases. We agree the scope and cost of each phase before we start it — no surprises.',
    },
  },
  {
    category: 'support',
    question: {
      ar: 'ماذا يحدث بعد الإطلاق؟',
      en: 'What happens after launch?',
    },
    answer: {
      ar: 'نبقى سَنَدك: مراقبةٌ على مدار الساعة، تطويرٌ مستمر، وعقد دعمٍ باستجابةٍ مضمونة.',
      en: 'We stay your backing: round-the-clock monitoring, ongoing iteration, and a support contract with a guaranteed response time.',
    },
  },
  {
    category: 'general',
    question: {
      ar: 'هل تبنون الويب والجوال معًا؟',
      en: 'Do you build both web and mobile?',
    },
    answer: {
      ar: 'نعم — منصّات الويب وتطبيقات iOS وأندرويد والأنظمة الخلفية، من فريقٍ واحدٍ يحمل المشروع كاملًا.',
      en: 'Yes — web platforms, iOS and Android apps, and the backend, from one team that carries the whole project.',
    },
  },
  {
    category: 'process',
    question: {
      ar: 'هل يمكن تعديل النطاق أثناء التنفيذ؟',
      en: 'Can we change scope during the project?',
    },
    answer: {
      ar: 'نعم. لأننا نعمل على مراحل، نراجع الأولويات في اجتماعنا الأسبوعي، ونعتمد أيّ تغييرٍ في النطاق معك قبل تطبيقه على المرحلة القادمة.',
      en: 'Yes. Because we work in phases, we review priorities in the weekly meeting and agree any scope change with you before it applies to the next phase.',
    },
  },
  {
    category: 'process',
    question: {
      ar: 'كم يستغرق مشروعٌ نموذجي؟',
      en: 'How long does a typical project take?',
    },
    answer: {
      ar: 'يعتمد على النطاق، لكن أول نسخةٍ قابلة للإطلاق تستغرق غالبًا من ٦ إلى ١٢ أسبوعًا موزّعة على مراحل، وتُطلق كلُّ مرحلةٍ قيمةً قابلةً للاستخدام.',
      en: 'It depends on scope, but a first launchable version usually takes 6–12 weeks across phases, with each phase shipping usable value.',
    },
  },
  {
    category: 'pricing',
    question: {
      ar: 'هل تقدّمون سعرًا ثابتًا أم بالساعة؟',
      en: 'Do you offer a fixed price or hourly rate?',
    },
    answer: {
      ar: 'نُفضّل السعر الثابت لكل مرحلة — تعرف تكلفة المرحلة ونطاقها قبل أن تبدأ، وتقرّر الاستمرار مرحلةً بمرحلة.',
      en: 'We prefer a fixed price per phase — you know a phase’s cost and scope before it starts, and decide to continue phase by phase.',
    },
  },
  {
    category: 'pricing',
    question: {
      ar: 'هل أحتاج تحديد كامل الميزانية من البداية؟',
      en: 'Do I need to commit the full budget upfront?',
    },
    answer: {
      ar: 'لا. تلتزم بمرحلةٍ واحدة في كل مرة، فتبدأ بأقلّ مخاطرة وترى نتيجةً حقيقية قبل أن تلتزم بالتالية.',
      en: 'No. You commit to one phase at a time, so you start with the least risk and see a real result before committing to the next.',
    },
  },
  {
    category: 'support',
    question: {
      ar: 'هل تسلّمون الكود والتوثيق؟',
      en: 'Do you hand over the code and documentation?',
    },
    answer: {
      ar: 'نعم. الكود ملكك، ونسلّمه موثَّقًا مع جلسة تسليمٍ لفريقك، فلا تبقى مرتبطًا بنا إلا بقدر ما تريد.',
      en: 'Yes. The code is yours — we hand it over documented, with a handover session for your team, so you’re only tied to us as much as you want to be.',
    },
  },
  {
    category: 'support',
    question: {
      ar: 'ما سرعة استجابتكم عند وجود عطل؟',
      en: 'How fast do you respond when something breaks?',
    },
    answer: {
      ar: 'عقد الدعم يحدّد زمن استجابةٍ مضمونًا للأعطال الحرجة، مع مراقبةٍ تنبّهنا غالبًا قبل أن تلاحظ المشكلة.',
      en: 'The support contract sets a guaranteed response time for critical issues, with monitoring that often alerts us before you even notice.',
    },
  },
  {
    category: 'general',
    question: {
      ar: 'أين يعمل فريقكم، وهل تعملون عن بُعد؟',
      en: 'Where is your team, and do you work remotely?',
    },
    answer: {
      ar: 'نعمل عن بُعدٍ أولًا مع اجتماعاتٍ أسبوعية منتظمة، فنخدم عملاءنا أينما كانوا دون أن تتأثّر جودة التواصل.',
      en: 'We’re remote-first with regular weekly meetings, so we serve clients wherever they are without compromising how closely we communicate.',
    },
  },
];

/**
 * Default navigation menus (the website header + footer) from `nav.*` so the chrome is never
 * blank (U9 / WEB1). The menu is keyed; its items carry the localized labels (N5).
 */
export const SEED_MENUS: readonly SeedMenu[] = [
  // The primary (top-nav) menu is a flat list of links (the nav renders items, not columns).
  {
    key: 'primary',
    items: [
      { url: '/services', label: { ar: 'خدماتنا', en: 'Services' } },
      { url: '/portfolio', label: { ar: 'أعمالنا', en: 'Work' } },
      { url: '/process', label: { ar: 'آلية العمل', en: 'Process' } },
      { url: '/about', label: { ar: 'من نحن', en: 'About' } },
      { url: '/blog', label: { ar: 'المدوّنة', en: 'Blog' } },
      { url: '/faq', label: { ar: 'الأسئلة الشائعة', en: 'FAQ' } },
      { url: '/contact', label: { ar: 'تواصل معنا', en: 'Contact' } },
    ],
  },
  // The footer is columns: each top-level item is a COLUMN TITLE (a non-link span in the footer)
  // and its `children` are the links under it (W6 one-level nesting). Every public page is
  // reachable here — the marketing routes plus Careers + the legal pages (privacy/terms, 8.E-4).
  {
    key: 'footer',
    items: [
      {
        url: '/about',
        label: { ar: 'الشركة', en: 'Company' },
        children: [
          { url: '/about', label: { ar: 'من نحن', en: 'About' } },
          { url: '/portfolio', label: { ar: 'أعمالنا', en: 'Work' } },
          { url: '/blog', label: { ar: 'المدوّنة', en: 'Blog' } },
          { url: '/careers', label: { ar: 'الوظائف', en: 'Careers' } },
        ],
      },
      {
        url: '/services',
        label: { ar: 'الخدمات', en: 'Services' },
        children: [
          { url: '/services', label: { ar: 'خدماتنا', en: 'Services' } },
          { url: '/process', label: { ar: 'آلية العمل', en: 'Process' } },
          { url: '/faq', label: { ar: 'الأسئلة الشائعة', en: 'FAQ' } },
          { url: '/contact', label: { ar: 'تواصل معنا', en: 'Contact' } },
        ],
      },
      {
        url: '/privacy',
        label: { ar: 'قانوني', en: 'Legal' },
        children: [
          {
            url: '/privacy',
            label: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
          },
          {
            url: '/terms',
            label: { ar: 'شروط الاستخدام', en: 'Terms of Service' },
          },
        ],
      },
    ],
  },
];

/**
 * Default blog categories (the blog filter) so the blog index is never blank (U9 / WEB1).
 * Real articles are admin-authored; the taxonomy seeds so the FE filter is populated.
 */
export const SEED_BLOG_CATEGORIES: readonly SeedBlogCategory[] = [
  {
    slug: 'engineering',
    name: { ar: 'الهندسة', en: 'Engineering' },
    description: {
      ar: 'كيف نبني — معمارية، جودة، وتسليمٌ على مراحل.',
      en: 'How we build — architecture, quality and phased delivery.',
    },
  },
  {
    slug: 'product',
    name: { ar: 'المنتج', en: 'Product' },
    description: {
      ar: 'من الفكرة إلى منتجٍ حيّ: اكتشافٌ، نطاقٌ، وقرارات.',
      en: 'From idea to a live product: discovery, scope and decisions.',
    },
  },
  {
    slug: 'company',
    name: { ar: 'الشركة', en: 'Company' },
    description: {
      ar: 'أخبار سَنَد، ثقافتنا، وآلية عملنا مع العملاء.',
      en: 'Sanad news, our culture and how we work with clients.',
    },
  },
];

/** Default blog tags (the article topic chips). */
export const SEED_BLOG_TAGS: readonly SeedBlogTag[] = [
  { slug: 'nestjs', name: { ar: 'NestJS', en: 'NestJS' } },
  {
    slug: 'microservices',
    name: { ar: 'الخدمات المصغّرة', en: 'Microservices' },
  },
  { slug: 'process', name: { ar: 'آلية العمل', en: 'Process' } },
];

/**
 * Default PUBLISHED blog posts (U9 / WEB1) — the articles the `/blog` index + post pages render,
 * so the public blog is never empty (the public path forces `status=published`, WEB2). Business-
 * voiced, both-locale `title`/`excerpt`/`body` (prose paragraphs separated by a blank line — the
 * article splits on it). Seeded idempotent on `slug`; an admin edits/replaces them, existing rows
 * are never overwritten. `publishedAt` is auto-stamped server-side on create; `coverMediaId` is
 * null → the amber blog-planet fallback (F3). `categorySlug`/`authorSlug`/`tagSlugs` resolve to
 * ids at seed time.
 */
export const SEED_BLOG_POSTS: readonly SeedBlogPost[] = [
  {
    slug: 'building-phase-by-phase',
    categorySlug: 'engineering',
    authorSlug: 'samer-al-hasan',
    tagSlugs: ['microservices', 'process'],
    status: 'published',
    readMinutes: 6,
    title: {
      ar: 'لماذا نبني مرحلةً تلو الأخرى',
      en: 'Why we build phase by phase',
    },
    excerpt: {
      ar: 'التسليم المرحلي يجعل التقدّم مرئيًّا والمخاطر صغيرة — إليك كيف نطبّقه.',
      en: 'Phased delivery makes progress visible and risk small — here is how we apply it.',
    },
    body: {
      ar: 'نقسّم كل مشروع إلى مراحل صغيرة قابلة للاعتماد، فتصل إلى نتيجةٍ ملموسة في نهاية كل مرحلة بدل الانتظار حتى النهاية لترى شيئًا.\n\nقبل أن نبدأ مرحلةً جديدة، نُريك ما أنجزناه في السابقة ونتفق معك على نطاقها. هكذا يبقى التقدّم مرئيًّا، وتبقى المخاطر صغيرة لأنها لا تتراكم.\n\nإن تغيّرت أولوياتك في المنتصف، نُعيد ترتيب المراحل القادمة معك — لا نُعيد بناء ما مضى. هذه هي الطريقة التي نحمي بها وقتك وميزانيتك.',
      en: 'We split every project into small, approvable phases, so you reach a concrete result at the end of each one instead of waiting until the end to see anything.\n\nBefore we start a new phase, we show you what we shipped in the last one and agree its scope with you. Progress stays visible, and risk stays small because it never piles up.\n\nIf your priorities change midway, we re-order the phases ahead with you — we do not rebuild what is behind. This is how we protect your time and your budget.',
    },
  },
  {
    slug: 'weekly-owner-meetings',
    categorySlug: 'company',
    authorSlug: 'layan-qasim',
    tagSlugs: ['process'],
    status: 'published',
    readMinutes: 4,
    title: {
      ar: 'اجتماعٌ أسبوعيّ معك — لماذا نُريك العمل كل أسبوع',
      en: 'A weekly meeting with you — why we show you the work every week',
    },
    excerpt: {
      ar: 'لقاءٌ ثابتٌ كل أسبوع يُبقيك على اطّلاعٍ ويمنع المفاجآت في التسليم.',
      en: 'A fixed weekly meeting keeps you in the loop and keeps surprises out of delivery.',
    },
    body: {
      ar: 'كل أسبوع نجلس معك في لقاءٍ قصير: نُريك ما بنيناه، نسمع ملاحظاتك، ونتفق على خطوة الأسبوع القادم.\n\nهذا الإيقاع الثابت يمنع أكبر مصدرٍ للإحباط في المشاريع البرمجية — أن تنتظر شهورًا ثم تكتشف أن ما بُني ليس ما أردت. عندنا، القرار يُتَّخذ معك مبكرًا وباستمرار.\n\nالاجتماع الأسبوعي ليس تقريرًا نُرسله، بل حوارٌ تراقب فيه مشروعك يكبر أمام عينيك وتوجّهه بنفسك.',
      en: 'Every week we sit with you in a short meeting: we show you what we built, we hear your feedback, and we agree the next week’s step together.\n\nThis steady rhythm removes the biggest source of frustration in software projects — waiting months, then discovering that what was built is not what you wanted. With us, the decision is made with you early and continuously.\n\nThe weekly meeting is not a report we send; it is a conversation where you watch your project grow in front of you and steer it yourself.',
    },
  },
  {
    slug: 'one-identity-many-services',
    categorySlug: 'engineering',
    authorSlug: 'yousef-murad',
    tagSlugs: ['microservices', 'nestjs'],
    status: 'published',
    readMinutes: 5,
    title: {
      ar: 'هويّةٌ واحدة، خدماتٌ كثيرة — كيف نُبقي تسجيل الدخول بسيطًا وآمنًا',
      en: 'One identity, many services — how we keep login simple and safe',
    },
    excerpt: {
      ar: 'منصّةٌ من خدماتٍ متعددة، ومع ذلك مستخدمك يسجّل الدخول مرّةً واحدة بأمان.',
      en: 'A platform of many services, yet your user signs in once, safely.',
    },
    body: {
      ar: 'نبني منصّاتك من خدماتٍ مستقلّة، كلٌّ منها مسؤول عن مجالٍ واحد. لكن مستخدمك لا يرى هذا التعقيد — يسجّل الدخول مرّةً واحدة وينتقل بين كل شيء بسلاسة.\n\nخلف الكواليس، خدمةٌ واحدة تملك الهُويّة والصلاحيات. البوابة تتحقّق من هُويّة المستخدم مرّةً، ثم تُخبر بقية الخدمات مَن هو وما الذي يُسمح له به — دون أن تمرّ كلمة السر أو تُخزَّن في أكثر من مكان.\n\nالنتيجة: أمانٌ أوضح لأن نقطة التحقّق واحدة، وتجربةٌ أبسط لمستخدمك، وقدرةٌ على إضافة خدماتٍ جديدة لاحقًا دون إعادة بناء تسجيل الدخول.',
      en: 'We build your platforms from independent services, each responsible for one domain. But your user never sees that complexity — they sign in once and move between everything smoothly.\n\nBehind the scenes, a single service owns identity and permissions. The gateway verifies the user once, then tells the other services who they are and what they may do — without the password ever travelling to, or being stored in, more than one place.\n\nThe result: clearer security because there is one point of verification, a simpler experience for your user, and the freedom to add new services later without rebuilding login.',
    },
  },
  {
    slug: 'we-stay-after-launch',
    categorySlug: 'product',
    authorSlug: 'noor-al-ali',
    tagSlugs: ['process'],
    status: 'published',
    readMinutes: 4,
    title: {
      ar: 'لا نختفي عند الإطلاق — ما الذي يعنيه الدعم بعد التسليم',
      en: 'We don’t disappear at launch — what post-delivery support really means',
    },
    excerpt: {
      ar: 'الإطلاق بدايةٌ لا نهاية — نبقى معك لنُثبّت المنتج ونطوّره.',
      en: 'Launch is a beginning, not an end — we stay to stabilize and grow the product.',
    },
    body: {
      ar: 'كثيرٌ من الشركات تُسلّم المشروع وتختفي. نحن نرى الإطلاق أول يومٍ للمنتج، لا آخره.\n\nبعد الإطلاق نُراقب الأداء، نُصلح ما يظهر من ملاحظات، ونبقى على تواصلٍ معك لأي طارئ. مستخدموك الحقيقيون يكشفون ما لا يكشفه أي اختبار، ونحن جاهزون للاستجابة بسرعة.\n\nكما نساعدك على قراءة الأرقام: ما الذي يستخدمه الناس فعلًا، وأين يتعثّرون. من هذه القراءة تولد المرحلة القادمة من التطوير — مبنيّةً على واقعٍ لا على تخمين.',
      en: 'Many firms hand over the project and disappear. We see launch as the product’s first day, not its last.\n\nAfter launch we watch performance, fix the feedback that surfaces, and stay reachable for anything urgent. Your real users reveal what no test can, and we are ready to respond quickly.\n\nWe also help you read the numbers: what people actually use, and where they stumble. From that reading the next phase of work is born — built on reality, not on guesswork.',
    },
  },
];
