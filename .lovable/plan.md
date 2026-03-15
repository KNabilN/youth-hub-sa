
المشكلة الفعلية بعد مراجعة الكود + الشبكة ليست “amount=0” كسبب رئيسي في الحالة التي التقطناها:
- طلب الدفع إلى Moyasar ظهر فيه payload كامل فعلاً (`amount: 125` + `source` + `callback_url`) وتمت المتابعة حتى `payment-callback` ثم `moyasar-verify-payment` بنجاح.
- لذلك لقطة `request_payload: null` ليست دليلًا كافيًا وحدها على أن الواجهة ترسل null دائمًا.

Do I know what the issue is? نعم: السبب الجذري الأرجح “تهيئة هشة + lock بعد أول فشل عابر” داخل `MoyasarPaymentForm`، وليس فقط selector.

الجذور التقنية في الكود الحالي:
1) `initKeyRef` يتم تعيينه قبل نجاح `Moyasar.init`  
   - إذا فشلت التهيئة مرة واحدة (race/DOM timing) يتقفل الفورم على نفس المفتاح ولن يعيد المحاولة.
2) الاعتماد على selector عام `.moyasar-form`  
   - قابل للتصادم وغير deterministic عند تعدد/إعادة mount.
3) لا يوجد gating صريح لكفاية المدخلات قبل init  
   - مثل `amount > 0` و`callbackUrl` غير فارغ و`publishableKey` جاهز.
4) لا يوجد handling قوي لفشل تحميل سكربت Moyasar  
   - لا timeout واضح + لا حالة خطأ مرئية للمستخدم.

خطة الإصلاح (تنفيذ):
1) تقوية `src/components/payment/MoyasarPaymentForm.tsx`
- إنشاء selector فريد لكل instance (id ثابت بالـ ref) بدل class عام.
- عدم تشغيل `Moyasar.init` إلا إذا:
  - `Number.isFinite(amount)` و`amount > 0`
  - `publishableKey` و`callbackUrl` غير فارغين.
- نقل `initKeyRef.current = key` ليكون بعد نجاح `Moyasar.init` فقط.
- إضافة retry strategy بسيطة (مثلاً 2-3 محاولات قصيرة) عند فشل init.
- إضافة script loader robust:
  - `onload`, `onerror`, timeout
  - حالة UI واضحة: loading / failed + زر “إعادة المحاولة”.
- cleanup كامل للـ timers/intervals عند unmount.

2) منع mount المبكر في مستهلكي الدفع
- `src/pages/Checkout.tsx`
- `src/pages/Donations.tsx`
- `src/components/bids/BidPaymentDialog.tsx`
- لا نعرض `MoyasarPaymentForm` إلا إذا:
  - key موجود
  - callbackUrl موجود
  - amount المحسوب صالح وأكبر من صفر.
- تعطيل زر متابعة الدفع الإلكتروني إذا amount غير صالح.

3) تثبيت قيمة amount لحظة بدء الدفع
- حفظ `finalPayableAmount` في state وقت الضغط على “تأكيد الدفع”، وتمريره للفورم بدل الاعتماد على recompute قد يتغير بعد re-renders.

4) تحقق نهائي (E2E) على المسارات الثلاثة
- Donation
- Checkout
- Bid (electronic + mixed remainder electronic)
ومعيار النجاح:
- يظهر iframe دائمًا
- لا شاشة فارغة
- `POST /v1/payments` يحمل payload صحيح
- callback والتحقق يعملان طبيعيًا.

ملاحظة مهمة:
- لا حاجة لتعديل قاعدة البيانات أو وظائف backend لهذا الإصلاح؛ المشكلة في دورة التهيئة بالواجهة.
