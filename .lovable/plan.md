
# توسيط أعمدة الجداول وتحسين RTL

## المشكلة
- رؤوس الأعمدة (`TableHead`) تستخدم `text-left` مما يجعلها غير متوسطة مع بيانات الصفوف
- بيانات الصفوف (`TableCell`) غير متوسطة أيضاً
- بعض الأيقونات داخل الجداول تستخدم `ml-1` بدلاً من `ms-1`

## التغييرات المطلوبة

### 1. تحديث مكون `table.tsx` الأساسي
**الملف:** `src/components/ui/table.tsx`

- `TableHead`: تغيير `text-left` إلى `text-center` وتغيير `pr-0` إلى `pe-0`
- `TableCell`: إضافة `text-center` وتغيير `pr-0` إلى `pe-0`

هذا التغيير سيؤثر تلقائياً على جميع الجداول في التطبيق (المستخدمين، التذاكر، سجل التدقيق، الفواتير، سجلات الساعات).

### 2. تصحيح RTL في أيقونات الجداول
**الملف:** `src/components/admin/UserTable.tsx`
- تغيير `ml-1` إلى `ms-1` في أيقونات شارات التوثيق والحالة (3 أماكن)
- تغيير `mr-auto` إلى `me-auto` في زر تسجيل مستخدم

### 3. الجداول المتأثرة تلقائياً
بتعديل المكون الأساسي فقط، ستتأثر جميع هذه الجداول:
- جدول المستخدمين (AdminUsers)
- جدول التذاكر (AdminTickets)
- جدول سجل التدقيق (AdminAuditLog)
- جدول الفواتير (Invoices)
- جدول سجلات الساعات (TimeLogTable)

### التفاصيل التقنية

```text
TableHead (قبل): "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
TableHead (بعد): "h-12 px-4 text-center align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pe-0"

TableCell (قبل): "p-4 align-middle [&:has([role=checkbox])]:pr-0"
TableCell (بعد): "p-4 align-middle text-center [&:has([role=checkbox])]:pe-0"
```
