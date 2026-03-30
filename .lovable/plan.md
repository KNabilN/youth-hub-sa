

# تصدير Excel بصيغة XLSX بدلاً من CSV

## المشكلة
التصدير الحالي ينتج ملف CSV يفتح في Excel بأعمدة ضيقة جداً، النصوص العربية تتداخل، والتواريخ تظهر كـ "########".

## الحل
تحويل نظام التصدير من CSV إلى XLSX حقيقي باستخدام مكتبة `xlsx` (SheetJS) مع:
- عرض أعمدة تلقائي بناءً على محتوى البيانات
- دعم RTL للنصوص العربية
- تنسيق الهيدر (خط عريض + خلفية ملونة)

## التغييرات

### 1. تثبيت مكتبة `xlsx`
إضافة `xlsx` كـ dependency

### 2. تعديل `src/lib/csv-export.ts` → إضافة دالة `downloadXLSX`
- دالة جديدة `downloadXLSX(filename, headers, rows)` تنشئ ملف XLSX
- حساب عرض كل عمود تلقائياً من أطول قيمة فيه (مع حد أدنى وأقصى)
- تنسيق صف الهيدر
- الإبقاء على `downloadCSV` للاستخدامات الأخرى

### 3. تعديل `src/components/admin/ExportDialog.tsx`
- استبدال `downloadCSV` بـ `downloadXLSX`
- تغيير اسم الملف من `.csv` إلى `.xlsx`
- تغيير نص الزر من "تصدير CSV" إلى "تصدير Excel"

### 4. تعديل صفحات التصدير المباشر
- `ExportUsersDialog.tsx` — استخدام `downloadXLSX`
- `AdminReports.tsx` — استخدام `downloadXLSX` في جميع دوال التصدير
- `AdminFinance.tsx` — استخدام `downloadXLSX`

### ملفات متأثرة

| الملف | العملية |
|-------|---------|
| `package.json` | إضافة `xlsx` |
| `src/lib/csv-export.ts` | إضافة `downloadXLSX` |
| `src/components/admin/ExportDialog.tsx` | استبدال CSV بـ XLSX |
| `src/components/admin/ExportUsersDialog.tsx` | استبدال CSV بـ XLSX |
| `src/pages/admin/AdminReports.tsx` | استبدال CSV بـ XLSX |
| `src/pages/admin/AdminFinance.tsx` | استبدال CSV بـ XLSX |

