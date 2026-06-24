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

export interface SeedFaq {
  category: FaqCategory;
  question: LocalizedText;
  answer: LocalizedText;
}

export interface SeedMenuItem {
  url: string;
  label: LocalizedText;
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
        ar: 'بيت برمجيات — تسليمٌ على مراحل',
        en: 'A software house — delivered in phases',
      },
      title: {
        ar: 'نَبني نظامك، ونبقى سَنَدَك بعد الإطلاق',
        en: 'We build your system — and stay your backing after launch',
      },
      subtitle: {
        ar: 'من الفكرة إلى منتجٍ حيٍّ يعمل: أنظمة SaaS، تطبيقات جوال، منصّات تعلّم، وأنظمة ERP — نُسلّمها مرحلةً تلو الأخرى، باجتماعٍ أسبوعيٍّ يبقيك على اطّلاع، ودعمٍ لا ينقطع بعد التسليم.',
        en: "From idea to a live, working product: SaaS, mobile apps, learning platforms and ERP systems — delivered phase by phase, with a weekly meeting that keeps you in the loop and support that doesn't stop at handover.",
      },
      blocks: [
        {
          type: 'cta',
          data: { href: '/contact', variant: 'primary' },
          title: { ar: 'ابدأ مشروعك', en: 'Start your project' },
        },
      ],
    },
    {
      type: 'services',
      eyebrow: { ar: 'ما نبنيه', en: 'What we build' },
      title: {
        ar: 'قدرةٌ كاملة تحت سقفٍ واحد',
        en: 'A full capability under one roof',
      },
      blocks: [],
    },
    {
      type: 'process',
      eyebrow: { ar: 'آلية العمل', en: 'How we work' },
      title: {
        ar: 'مسارٌ واضح، مرحلةً تلو الأخرى',
        en: 'A clear path, phase by phase',
      },
      blocks: [
        {
          type: 'step',
          data: { step: 1 },
          title: { ar: 'اكتشاف', en: 'Discovery' },
          body: {
            ar: 'نفهم عملك وأهدافك، ونرسم النطاق والخريطة الزمنية.',
            en: 'We learn your business and goals, then map scope and timeline.',
          },
        },
        {
          type: 'step',
          data: { step: 2 },
          title: { ar: 'تصميم', en: 'Design' },
          body: {
            ar: 'تجربةٌ وواجهاتٌ تراها وتعتمدها قبل أن نكتب سطرًا واحدًا.',
            en: 'Experience and interfaces you see and approve before a line is written.',
          },
        },
        {
          type: 'step',
          data: { step: 3 },
          title: { ar: 'تطوير', en: 'Build' },
          body: {
            ar: 'بناءٌ مرحليٌّ يُراجَع كل أسبوع — تقدّمٌ تراه، لا وعودٌ تنتظرها.',
            en: 'Phased build reviewed every week — progress you watch, not promises you wait on.',
          },
        },
        {
          type: 'step',
          data: { step: 4 },
          title: { ar: 'إطلاق', en: 'Launch' },
          body: {
            ar: 'نُطلق على السحابة، ثم نبقى للمراقبة والتطوير والدعم.',
            en: 'We launch to the cloud, then stay for monitoring, iteration and support.',
          },
        },
      ],
    },
    {
      type: 'stats',
      title: { ar: 'أرقامٌ تختصر رحلتنا', en: 'The numbers behind the work' },
      blocks: [
        {
          type: 'stat',
          data: { value: 0, suffix: '+' },
          title: { ar: 'مشروعًا سُلّم', en: 'Projects delivered' },
        },
        {
          type: 'stat',
          data: { value: 0, suffix: '+' },
          title: { ar: 'عميلًا نثق بنا', en: 'Clients backing us' },
        },
        {
          type: 'stat',
          data: { value: 100, suffix: '%' },
          title: { ar: 'التزام الدعم', en: 'Support commitment' },
        },
      ],
    },
    {
      type: 'cta',
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
      ],
    },
  ],
};

/** The pages seeded on first boot (more pages — about/services/contact — land in P8). */
export const SEED_PAGES: readonly SeedPage[] = [LANDING];

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
];

/**
 * Default navigation menus (the website header + footer) from `nav.*` so the chrome is never
 * blank (U9 / WEB1). The menu is keyed; its items carry the localized labels (N5).
 */
export const SEED_MENUS: readonly SeedMenu[] = [
  {
    key: 'primary',
    items: [
      { url: '/services', label: { ar: 'خدماتنا', en: 'Services' } },
      { url: '/work', label: { ar: 'أعمالنا', en: 'Work' } },
      { url: '/process', label: { ar: 'آلية العمل', en: 'Process' } },
      { url: '/about', label: { ar: 'من نحن', en: 'About' } },
      { url: '/blog', label: { ar: 'المدوّنة', en: 'Blog' } },
      { url: '/contact', label: { ar: 'تواصل معنا', en: 'Contact' } },
    ],
  },
  {
    key: 'footer',
    items: [
      { url: '/about', label: { ar: 'من نحن', en: 'About' } },
      { url: '/services', label: { ar: 'خدماتنا', en: 'Services' } },
      { url: '/work', label: { ar: 'أعمالنا', en: 'Work' } },
      { url: '/blog', label: { ar: 'المدوّنة', en: 'Blog' } },
      { url: '/contact', label: { ar: 'تواصل معنا', en: 'Contact' } },
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
 * A single sample DRAFT post (U9 / WEB1) — proves the editorial pipeline (category + author +
 * tags embed, both-locale copy) without publishing placeholder content to the live site. Drafts
 * never leak on the public path (WEB2); the admin sees it from the `manage` list. `categorySlug`/
 * `authorSlug`/`tagSlugs` are resolved to ids at seed time.
 */
export const SEED_BLOG_POSTS: readonly SeedBlogPost[] = [
  {
    slug: 'building-phase-by-phase',
    categorySlug: 'engineering',
    authorSlug: 'samer-al-hasan',
    tagSlugs: ['microservices', 'process'],
    status: 'draft',
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
      ar: 'نقسّم كل مشروع إلى مراحل صغيرة قابلة للاعتماد، ونلتقي أسبوعيًّا لنُريك ما أنجزناه قبل الانتقال للمرحلة التالية. هذه مسوّدة تجريبية تُحرَّر من لوحة الإدارة.',
      en: 'We split every project into small, approvable phases and meet weekly to show you what we shipped before moving on. This is a sample draft, edited from the admin portal.',
    },
  },
];
