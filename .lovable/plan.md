

## اصلاح اتجاه RTL في صفحة تفاصيل المستخدم

### المشكلة
الصفحة بالفعل داخل صفحة `dir="rtl"` (محدد في `index.html`)، لذلك استخدام `flex-row-reverse` يعكس الاتجاه مرتين -- مما يجعل العناصر تظهر من اليسار بدلاً من اليمين.

### الحل
ازالة `flex-row-reverse` و `justify-end` من جميع العناصر التالية لأن RTL الافتراضي يكفي:

### التعديلات في `src/pages/admin/AdminUserDetail.tsx`:

1. **InfoField (سطر 95):** ازالة `flex-row-reverse text-end` -- في RTL الايقونة ستظهر تلقائياً على اليمين
2. **TabsList (سطر 284):** ازالة `flex-row-reverse justify-end` -- التبويبات ستبدأ تلقائياً من اليمين
3. **CardTitle للبيانات الأساسية (سطر 299):** ازالة `flex-row-reverse justify-end`
4. **CardTitle لبيانات ضابط الاتصال (سطر 316):** ازالة `flex-row-reverse justify-end`
5. **CardTitle لمعلومات إضافية (سطر 333):** ازالة `flex-row-reverse justify-end`
6. **ازالة `dir="rtl"` من الـ grids** (أسطر 305، 322، 339) لأنه موروث من الصفحة

### السبب التقني
عندما يكون `dir="rtl"` مفعّل على مستوى الصفحة، فإن flexbox يعكس الاتجاه تلقائياً. إضافة `flex-row-reverse` فوق ذلك يعيده للاتجاه الأصلي (LTR)، وهو عكس المطلوب.

