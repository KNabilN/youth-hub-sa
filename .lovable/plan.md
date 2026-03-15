
# خطة: إنشاء طلب تلقائي عند شراء جمعية لخدمة مباشرة

## الحالة: ✅ تم التنفيذ

### ما تم تنفيذه

1. **Edge Function `moyasar-verify-payment`** — تعديل `processCheckout`: التحقق من دور المشتري عبر `user_roles`. إذا كان `youth_association` وليس هناك `beneficiary_id`، يُنشأ المشروع والعقد تلقائياً
2. **`src/hooks/useBankTransfer.ts`** — نفس المنطق للتحويل البنكي: إنشاء مشروع تلقائي إذا كان المشتري جمعية
3. **`src/hooks/usePurchaseService.ts`** — نفس المنطق للشراء المباشر: إنشاء مشروع + عقد تلقائي
4. **`src/pages/Checkout.tsx`** — إخفاء اختيار "الجمعية المستفيدة" للجمعيات + تعديل مسار `grant_balance` لإنشاء المشروع والعقد تلقائياً
5. **العقد** — يتم توقيعه تلقائياً من الجمعية (`association_signed_at = now`) عند الشراء المباشر
