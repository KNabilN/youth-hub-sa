
# خطة: إصلاح جذري وشامل لنظام الدفع الإلكتروني (Moyasar)

## الحالة: ✅ تم التنفيذ

### ما تم تنفيذه

1. **`MoyasarPaymentForm.tsx`** — إعادة كتابة كاملة لمنطق التهيئة:
   - MutationObserver يراقب حاوية Moyasar ولا يضبط `formReady=true` إلا بعد ظهور محتوى فعلي (iframe/form)
   - Timeout 8 ثوانٍ مع إعادة محاولة تلقائية (3 محاولات) قبل عرض خطأ
   - cleanup محكم لكل timers/observers
   - لا يظهر صندوق فارغ أبداً

2. **`moyasar-verify-payment` Edge Function** — تحصين أمني:
   - إعادة حساب الأسعار من قاعدة البيانات (server-side) بدل الثقة بقيم الواجهة
   - checkout: جلب أسعار الخدمات من `micro_services`
   - project_payment: جلب سعر العرض من `bids` أو ميزانية المشروع
   - donation: تحقق أن المبلغ المدفوع يطابق السياق
   - tolerance: 1 ر.س للتقريب
   - توافق مع التدفقات القديمة (legacy compatibility)

3. **`DonationTimeline.tsx`** — إضافة `forwardRef` لإصلاح خطأ console
