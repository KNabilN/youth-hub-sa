

## المشكلة

عند دفع الجمعية إلكترونياً عبر Moyasar من داخل صفحة تفاصيل الطلب، لا يوجد حالياً أي تكامل مع بوابة الدفع الإلكتروني. الزر الحالي "إنشاء ضمان مالي" ينشئ الضمان مباشرة بدون دفع فعلي. المطلوب أن تتم العملية مثل المانح: دفع إلكتروني → احتجاز تلقائي → فاتورة → إشعارات.

## الحل

### 1. تحديث صفحة تفاصيل الطلب (`ProjectDetails.tsx`)
- استبدال زر "إنشاء ضمان مالي" المباشر بمكون دفع يتيح خيارين: **دفع إلكتروني** و**تحويل بنكي**
- عند اختيار الدفع الإلكتروني:
  - جلب مفتاح Moyasar
  - عرض نموذج Moyasar مع `callback_url` يحتوي على سياق `project_payment`
  - تمرير بيانات المشروع (project_id, provider_id, amount, association_id)
- عند اختيار التحويل البنكي: نفس الفلو الحالي (رفع إيصال → إنشاء escrow بحالة pending_payment → bank_transfer)
- عرض تفصيل الأسعار (PricingBreakdownDisplay) قبل الدفع

### 2. تحديث Edge Function (`moyasar-verify-payment/index.ts`)
- إضافة معالج جديد `processProjectPayment` للسياق `project_payment`
- يقوم بـ:
  - إنشاء escrow بحالة `held` (الدفع تم فعلاً)
  - إصدار فاتورة تلقائية
  - إشعار الأدمن والمزود
  - تحديث حالة المشروع لا يتغير (يبقى in_progress)

### 3. تحديث `PaymentCallback.tsx`
- التعرف على سياق `project_payment` وتوجيه المستخدم للعودة لصفحة تفاصيل الطلب بعد نجاح الدفع

### الملفات المتأثرة
- `src/pages/ProjectDetails.tsx` — إضافة خيارات الدفع بدل زر الإنشاء المباشر
- `supabase/functions/moyasar-verify-payment/index.ts` — إضافة `processProjectPayment`
- `src/pages/PaymentCallback.tsx` — توجيه العودة حسب السياق

