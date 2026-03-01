

# اصلاح خطأ حفظ الملف الشخصي

## المشكلة
عند الضغط على "حفظ التغييرات" في صفحة الملف الشخصي، يظهر خطأ لأن الكود يحاول حفظ حقل `email_notifications` في جدول `profiles`، لكن هذا العمود غير موجود في قاعدة البيانات.

## الحل

### 1. إضافة عمود `email_notifications` لجدول `profiles`
إنشاء migration لإضافة العمود المفقود:

```sql
ALTER TABLE public.profiles 
ADD COLUMN email_notifications boolean NOT NULL DEFAULT true;
```

### 2. تعديل `src/pages/Profile.tsx`
التأكد من أن حقل `email_notifications` يُقرأ ويُحفظ بشكل صحيح بدون استخدام `as any`.

### التفاصيل التقنية
- العمود الجديد: `email_notifications` من نوع `boolean` مع قيمة افتراضية `true`
- لا حاجة لسياسات RLS إضافية لأن سياسات جدول `profiles` الحالية تغطي القراءة والتحديث
- الملف الوحيد الذي يحتاج تعديل هو `Profile.tsx` لإزالة `as any` من قراءة هذا الحقل

