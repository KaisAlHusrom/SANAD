/**
 * The Arabic message catalog — the **source of truth** for the backend's key tree (U8/U24).
 * `en.catalog.ts` is typed against it, so adding a key here without translating it there is a
 * compile error, and the parity spec guards the reverse.
 *
 * Keys are flat and dotted, namespaced by the surface that owns them: `common.*` and
 * `validation.*` belong to the shared edge (`@sanad/util`), the rest to the named service.
 * Placeholders are `{name}` and are filled from the message's `params`.
 */
export const AR_CATALOG = {
  // ── common — the envelope + the generic edge failures ──────────────────────────────
  'common.ok': 'تم',
  'common.created': 'تم الإنشاء بنجاح',
  'common.updated': 'تم الحفظ بنجاح',
  'common.deleted': 'تم الحذف بنجاح',
  'common.notFound': 'لم يتم العثور على المطلوب.',
  'common.internalError': 'حدث خطأ غير متوقع في الخادم. حاول مرة أخرى.',
  'common.requestFailed': 'تعذّر تنفيذ الطلب.',
  'common.upstreamError': 'الخدمة غير متاحة حالياً. حاول مرة أخرى بعد قليل.',
  'common.duplicate': 'هذا العنصر موجود مسبقاً.',
  'common.relatedConstraint':
    'لا يمكن إتمام العملية لارتباط هذا العنصر بعناصر أخرى.',
  'common.requiredFieldMissing': 'هناك حقل مطلوب لم يتم تعبئته.',
  'common.checkConstraint': 'إحدى القيم لا تحقق شرط التحقق المطلوب.',

  // ── validation — the Zod pipe (top-level + per-issue field errors) ─────────────────
  'validation.failed': 'تحقّق من الحقول المُدخلة.',
  'validation.required': 'هذا الحقل مطلوب.',
  'validation.invalidType': 'قيمة هذا الحقل غير صحيحة.',
  'validation.tooSmall': 'القيمة أقل من الحد المسموح.',
  'validation.tooBig': 'القيمة أكبر من الحد المسموح.',
  'validation.invalidString': 'صيغة هذا الحقل غير صحيحة.',
  'validation.invalidEnum': 'القيمة المختارة غير مسموح بها.',
  'validation.emptyUpdate': 'لم يتم تغيير أي حقل — عدّل قيمة واحدة على الأقل.',
  'validation.slug':
    'استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط (مثل: about-us).',
  'validation.hexColor': 'أدخل لوناً بصيغة سداسية عشرية مثل ‎#1A2B3C.',
  'validation.invalidPhone':
    'أدخل رقماً صحيحاً مع رمز الدولة، مثل ‎+966 50 123 4567.',
  'validation.unknownField': 'حقل غير معروف.',

  // ── auth — the gateway guards + the forwarded identity (MS4) ───────────────────────
  'auth.noIdentity': 'لم يتم التحقق من هويتك. سجّل الدخول مرة أخرى.',
  'auth.forbidden': 'لا تملك صلاحية تنفيذ هذا الإجراء.',
  'auth.missingToken': 'يلزم تسجيل الدخول للوصول إلى هذه الصفحة.',
  'auth.invalidToken': 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.',
  'auth.invalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth.invalidRefreshToken': 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.',

  // ── identity ──────────────────────────────────────────────────────────────────────
  'identity.userNotFound': 'لم يتم العثور على المستخدم «{id}».',
  'identity.emailConflict': 'البريد الإلكتروني «{email}» مستخدم مسبقاً.',
  'identity.roleNotFound': 'لم يتم العثور على الدور «{key}».',

  // ── content — one key per entity so the sentence reads naturally in Arabic ─────────
  'content.notFound': 'لم يتم العثور على «{idOrSlug}».',
  'content.notFound.page': 'لم يتم العثور على الصفحة «{idOrSlug}».',
  'content.notFound.section': 'لم يتم العثور على القسم «{idOrSlug}».',
  'content.notFound.block': 'لم يتم العثور على العنصر «{idOrSlug}».',
  'content.notFound.blogPost': 'لم يتم العثور على المقالة «{idOrSlug}».',
  'content.notFound.blogCategory':
    'لم يتم العثور على تصنيف المدونة «{idOrSlug}».',
  'content.notFound.blogTag': 'لم يتم العثور على الوسم «{idOrSlug}».',
  'content.notFound.service': 'لم يتم العثور على الخدمة «{idOrSlug}».',
  'content.notFound.portfolioProject':
    'لم يتم العثور على المشروع «{idOrSlug}».',
  'content.notFound.portfolioCategory':
    'لم يتم العثور على تصنيف الأعمال «{idOrSlug}».',
  'content.notFound.teamMember': 'لم يتم العثور على عضو الفريق «{idOrSlug}».',
  'content.notFound.testimonial': 'لم يتم العثور على رأي العميل «{idOrSlug}».',
  'content.notFound.faq': 'لم يتم العثور على السؤال «{idOrSlug}».',
  'content.notFound.menu': 'لم يتم العثور على القائمة «{idOrSlug}».',
  'content.notFound.menuItem': 'لم يتم العثور على عنصر القائمة «{idOrSlug}».',
  'content.notFound.lead': 'لم يتم العثور على طلب التواصل «{idOrSlug}».',
  'content.slugConflict': 'الرابط «{slug}» مستخدم مسبقاً.',

  // ── media ─────────────────────────────────────────────────────────────────────────
  'media.notFound': 'لم يتم العثور على الملف «{id}».',
  'media.invalidIds': 'معرّفات الملفات المُرسلة غير صحيحة.',
  'media.storageUnavailable': 'لم يتم إعداد مساحة التخزين على هذا الخادم.',
  'media.upload.typeNotAllowed': 'نوع الملف «{contentType}» غير مدعوم.',
  'media.upload.tooLarge': 'حجم الملف يتجاوز الحد المسموح ({maxMb} ميجابايت).',
  'media.cors.unsupported': 'هذا المزوّد لا يدعم فحص إعدادات CORS.',
  'media.cors.cannotCheck':
    'تعذّر قراءة إعدادات CORS للحاوية — الصلاحيات الحالية لا تسمح بذلك.',
  'media.cors.applyFailed': 'تعذّر تطبيق سياسة CORS على الحاوية.',
  'media.cors.unconfigured': 'لم يتم إعداد مساحة التخزين، فلا يوجد ما يُفحص.',
  'media.test.reachable':
    'تم الاتصال بنجاح — يمكن الوصول إلى الحاوية «{bucket}».',
  'media.test.signedOnlyPublicUrl':
    'يمكن الوصول إلى الحاوية «{bucket}»، لكن الرابط العام يشير إلى واجهة S3 — لن تظهر الصور. استخدم رابط r2.dev العام أو نطاقاً مخصصاً.',
  'media.test.missingFields': 'هناك حقول مطلوبة ناقصة — أكملها واحفظ أولاً.',
  'media.test.failed': 'فشل الاتصال بمساحة التخزين.',
  'media.folder.notFound': 'لم يتم العثور على المجلد «{id}».',
  'media.folder.duplicateName':
    'يوجد مجلد بالاسم «{name}» في هذا المكان. اختر اسماً آخر.',
  'media.folder.cycle':
    'لا يمكن نقل مجلد إلى داخل نفسه أو إلى أحد مجلداته الفرعية.',
  'media.folder.notEmpty':
    'المجلد «{name}» ما زال يحتوي على {assets} ملف و{folders} مجلد فرعي. أفرغه، أو اختر نقل محتوياته إلى المستوى الأعلى.',
  'media.move.tooMany': 'عدد الملفات المحددة للنقل أكبر من الحد المسموح.',

  // ── notifications ─────────────────────────────────────────────────────────────────
  'notifications.notFound': 'لم يتم العثور على الإشعار.',
  'notifications.leadAlert.subject': 'طلب جديد: {name}',
  'notifications.leadAlert.subjectTyped': 'طلب جديد: {name} ({projectType})',
  'notifications.leadAlert.heading': 'طلب جديد — {name}',
  'notifications.leadAlert.name': 'الاسم',
  'notifications.leadAlert.email': 'البريد الإلكتروني',
  'notifications.leadAlert.phone': 'رقم الجوال',
  'notifications.leadAlert.company': 'الجهة',
  'notifications.leadAlert.projectType': 'نوع المشروع',
  'notifications.leadAlert.source': 'المصدر',
  'notifications.leadAlert.locale': 'اللغة',
  'notifications.leadAlert.message': 'الرسالة',
  'notifications.leadRepeat.subject': 'طلب متكرر: {name} (المرة {count})',
  'notifications.leadRepeat.subjectUncounted': 'طلب متكرر: {name}',
  'notifications.leadRepeat.heading': '{name} تواصل معك مرة أخرى',
  'notifications.leadRepeat.lead':
    'هذه ليست فرصة جديدة — أُضيفت إلى نفس السجل. تواصلَ معك {count} مرات حتى الآن.',
  'notifications.leadRepeat.newMessage': 'ما كتبه هذه المرة',
  'notifications.test.connected':
    'تم الاتصال بنجاح — قَبِل الخادم «{host}:{port}» الاتصال.',
  'notifications.test.missingFields':
    'هناك حقول مطلوبة ناقصة — أكملها واحفظ أولاً.',
  'notifications.test.failed': 'فشل الاتصال بخادم البريد.',

  // ── settings ──────────────────────────────────────────────────────────────────────
  'settings.corsStorageOnly': 'فحص CORS يخصّ مساحة التخزين فقط.',
  'settings.test.unsupported': 'هذا المزوّد لا يدعم اختبار الاتصال.',
  'settings.unknownProvider':
    'المزوّد «{provider}» غير معروف ضمن «{capability}».',
  'settings.unknownField':
    'الحقل «{field}» غير معروف لدى المزوّد «{provider}».',
  'settings.value.expected.localizedText':
    'الإعداد «{key}» يتطلّب نصاً بالعربية والإنجليزية، أو قيمة فارغة.',
  'settings.value.expected.boolean': 'الإعداد «{key}» يتطلّب قيمة صح/خطأ.',
  'settings.value.expected.number': 'الإعداد «{key}» يتطلّب رقماً.',
  'settings.value.expected.string':
    'الإعداد «{key}» يتطلّب نصاً، أو قيمة فارغة.',
  'settings.value.outOfRange':
    'الإعداد «{key}» يتطلّب رقماً صحيحاً بين {min} و {max}.',

  // ── security — the gateway edge (P8.10.A) ─────────────────────────────────────────
  'security.rateLimited':
    'عدد الطلبات تجاوز الحد المسموح. حاول مرة أخرى بعد {seconds} ثانية.',
} as const;

/** Every message key the backend may emit — derived from the Arabic catalog (U3). */
export type MessageKey = keyof typeof AR_CATALOG;
