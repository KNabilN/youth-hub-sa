

# مراجعة ثانية — مشكلة حرجة تحتاج إصلاح فوري

## المشكلة الحرجة: إزالة سياسة INSERT على notifications كسرت الإشعارات

في التحديث السابق تم حذف سياسة `"Authenticated users insert notifications"` من جدول `notifications`، لكن هناك **6 ملفات في الكود** تقوم بإدراج إشعارات مباشرة من العميل (client-side):

- `src/pages/Checkout.tsx` (سطر 140)
- `src/hooks/usePurchaseService.ts` (سطرين 55 و 100)
- `src/hooks/useBankTransfer.ts` (سطرين 63 و 106)
- `src/hooks/useProfile.ts` (سطر 84)
- `src/hooks/useAdminNotifications.ts` (سطر 63)
- `src/lib/notifications.ts` (سطرين 10 و 34)

**النتيجة**: كل هذه الإشعارات ستفشل صامتة (silently fail) لأن سياسة RLS تمنع الإدراج الآن.

## الحل

### الخيار الأفضل: إعادة سياسة INSERT مع تقييد أفضل

بدلاً من السماح لأي مستخدم بإرسال إشعار لأي مستخدم آخر (المشكلة الأصلية)، نعيد السياسة مع تقييدها بحيث:
- يُسمح للمستخدم المسجّل بإنشاء إشعارات (لأن الكود يحتاج ذلك)
- الـ triggers تعمل بالفعل عبر SECURITY DEFINER فلا تتأثر

لكن المشكلة الأمنية الأصلية (إشعارات مزيفة) ستبقى. الحل الجذري يتطلب نقل كل عمليات إنشاء الإشعارات إلى Edge Functions أو triggers — وهذا تغيير كبير.

**الحل العملي الآن**: إعادة سياسة INSERT على notifications مع تقييدها للمستخدمين المصادق عليهم فقط (وهي كانت كذلك أصلاً). هذا يعيد الوظائف المكسورة ويُبقي الحماية الأساسية.

### تغييرات قاعدة البيانات
1. **Migration جديد**: إعادة إنشاء سياسة INSERT على `notifications` بنفس الشكل السابق — `auth.uid() IS NOT NULL`

### مشاكل أخرى (ثانوية)
2. **Leaked Password Protection**: لا يزال معطلاً — يحتاج تفعيل يدوي من إعدادات المصادقة
3. **RLS "always true" warning**: هذه التحذيرات على جداول عامة (categories, regions, ratings, site_content, cities, portfolio_items) — مقبولة لأنها بيانات عامة للقراءة فقط

### ملخص الملفات المتأثرة

| الملف/المورد | العملية |
|-------------|---------|
| Migration: إعادة INSERT policy على notifications | إنشاء |

لا تغييرات على الكود — فقط إصلاح قاعدة البيانات.

