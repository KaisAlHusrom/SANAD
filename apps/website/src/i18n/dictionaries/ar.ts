/**
 * Arabic (default, RTL) UI-chrome strings for the website (U8). Translatable *content*
 * (nav labels, marketing copy, brand name) comes from the API — these are only the
 * site's own chrome (states, form labels, fallbacks). The `en` catalog MUST mirror this
 * key tree exactly (parity spec).
 */
export const ar = {
  nav: {
    home: 'الرئيسية',
    services: 'خدماتنا',
    work: 'أعمالنا',
    about: 'من نحن',
    contact: 'تواصل معنا',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
  },
  cta: {
    startProject: 'ابدأ مشروعك',
    contactUs: 'تواصل معنا',
  },
  footer: {
    tagline: 'سند التقنية — نبني برمجياتك، مرحلةً تلو الأخرى.',
    rights: 'جميع الحقوق محفوظة',
    contact: 'تواصل',
    social: 'روابط التواصل الاجتماعي',
  },
  contact: {
    title: 'لنبدأ الحديث',
    lead: 'احكِ لنا عن مشروعك وسنعاود التواصل معك.',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'رقم الجوال',
    phoneHint: 'نتصل بك عليه مباشرة — اختر الدولة ثم أدخل الرقم.',
    phonePlaceholder: '5X XXX XXXX',
    phoneCountry: 'رمز الدولة',
    phoneCountrySearch: 'ابحث عن دولة',
    phoneNoCountry: 'لا توجد دولة مطابقة',
    invalidPhone: 'أدخل رقم جوال صحيحاً',
    company: 'الشركة',
    budget: 'الميزانية التقديرية',
    projectType: 'نوع المشروع',
    message: 'تفاصيل المشروع',
    optional: 'اختياري',
    submit: 'إرسال الطلب',
    submitting: 'جارٍ الإرسال…',
    success: 'تم استلام طلبك. سنعاود التواصل معك قريبًا.',
    error: 'تعذّر إرسال الطلب. حاول مرة أخرى.',
    required: 'هذا الحقل مطلوب',
    invalidEmail: 'بريد إلكتروني غير صالح',
  },
  states: {
    loading: 'جارٍ التحميل…',
    error: 'حدث خطأ ما',
    empty: 'لا يوجد محتوى بعد',
    notFound: 'الصفحة غير موجودة',
    retry: 'إعادة المحاولة',
  },
  language: {
    switch: 'English',
  },
  audio: {
    on: 'تشغيل الصوت',
    off: 'كتم الصوت',
    label: 'الصوت',
  },
  consent: {
    bar: {
      label: 'إشعار ملفات تعريف الارتباط',
      title: 'نطلب إذنك أولًا',
      body: 'لا نُشغّل أي أداة قياس أو إعلان قبل موافقتك. الملفات الضرورية وحدها تعمل الآن حتى يعمل الموقع.',
      acceptAll: 'قبول الكل',
      rejectAll: 'رفض الكل',
      customize: 'تخصيص',
    },
    dialog: {
      title: 'تفضيلات ملفات تعريف الارتباط',
      lead: 'اختر ما تسمح لنا باستخدامه. يمكنك تغيير هذا في أي وقت من أسفل أي صفحة.',
      close: 'إغلاق',
      save: 'حفظ التفضيلات',
      acceptAll: 'قبول الكل',
      rejectAll: 'رفض الكل',
      withdraw: 'سحب موافقتي',
      remembered: 'نحفظ اختيارك {{days}} يومًا، ثم نسألك مرة أخرى.',
    },
    categories: {
      necessary: {
        name: 'ضرورية',
        description:
          'تُشغّل أساسيات الموقع: اللغة، والأمان، وإرسال النماذج. بدونها لا يعمل الموقع.',
        alwaysOn: 'مطلوبة دائمًا',
      },
      analytics: {
        name: 'قياس الأداء',
        description:
          'تُظهر لنا الصفحات التي تهمّك وأين نتحسّن. أرقام مجمّعة، بلا هوية شخصية.',
      },
      marketing: {
        name: 'التسويق',
        description:
          'تقيس نتائج حملاتنا الإعلانية حتى تصل إلى من يبحث عن خدماتنا فعلًا.',
      },
    },
    vendors: {
      label: 'يُحمَّل عند الموافقة',
      none: 'لا شيء مُفعَّل حاليًا.',
    },
    state: {
      on: 'مُفعّل',
      off: 'مُعطّل',
    },
    links: {
      privacy: 'سياسة الخصوصية',
      cookies: 'سياسة ملفات تعريف الارتباط',
    },
    preferences: {
      open: 'تفضيلات ملفات تعريف الارتباط',
    },
    feedback: {
      notStored:
        'طُبّق اختيارك على هذه الجلسة فقط — يبدو أن التخزين في متصفحك معطّل، فلن نتذكّره بعد إغلاقه.',
    },
  },
};
