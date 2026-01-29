// assets/site-data.js
// إعدادات الموقع الأساسية (عدّل القيم هنا فقط عند الحاجة)
window.SITE_DATA = {
  brand: {
    academyName: "أكاديمية عايد",
    courseName: "دورة STEP المكثفة 2026",
    shortName: "عايد STEP 2026",
    tagline: "خطة واضحة + تدريب محاكي + متابعة — بإذن الله توصل لهدفك",
    telegramUsername: "Ayed_Academy_2026",
    telegramUrl: "https://t.me/Ayed_Academy_2026",
    watermarkText: "أكاديمية عايد",
  },
  exam: {
    // ملاحظة تسويقية مُحترمة: محاكاة مبنية على نمط النماذج الحديثة (وليس أسئلة قياس الرسمية)
    modelsReference: ["49", "50", "51"],
    updatesNote: "أي تحديثات/نماذج جديدة تُضاف للمشتركين أولاً بأول داخل قنوات الدورة.",
  },
  pricing: {
    currency: "ر.س",
    officialPrice: 599,
    discountPrice: 449,
    // خصم لمدة 7 أيام — عند الانتهاء يرجع السعر الرسمي تلقائياً
    discountEndsAtISO: "2026-02-05T03:27:03.615192Z",
    discountLabel: "عرض خاص لمدة 7 أيام",
  },
  seats: {
    // عدّاد المقاعد (افتراضي يبدأ من 250) — ينقص كل 40 ثانية داخل المتصفح
    initial: 250,
    decreaseEverySeconds: 40,
    refillThreshold: 5,
    refillAmount: 50,
  },
  bank: {
    bankName: "بنك الإنماء",
    accountNumber: "68206067557000",
    iban: "SA4905000068206067557000",
    beneficiary: "مؤسسة كريتيفا جلوبال لتقنية المعلومات",
    suggestedPurposeAr: "دورة STEP المكثفة 2026 - اسم الطالب",
    suggestedPurposeEn: "STEP Intensive 2026 - Student Name",
  },
  support: {
    replySla: "عادة يتم الرد خلال 24–48 ساعة (حسب ضغط الرسائل).",
    safetyNote: "تنبيه: لا تحول لأي جهة غير البيانات الرسمية داخل صفحة التسجيل — واحتفظ بإيصال التحويل.",
  },
  ui: {
    locale: "ar-SA",
    cacheVersion: "202601290327",
    enableSoftNav: true,
    enableToasts: true,
    toastsIntervalMs: 9000,
    enableInstallBanner: true,
  },
};
