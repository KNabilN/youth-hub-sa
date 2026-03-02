
# تحسين خط الأرقام وجعلها قابلة للنقر في كل الصفحات

## الملفات والتغييرات

### 1. `src/pages/admin/AdminDisputes.tsx` (سطر 134)
- تغيير من `text-xs text-muted-foreground` إلى `text-sm font-semibold`
- نقل الرابط (`Link`) من عمود المشروع إلى عمود الرقم (مثل ما تم في AdminServices)
- عمود المشروع يصبح نص عادي

### 2. `src/pages/admin/AdminTickets.tsx` (سطر 138)
- تغيير من `text-xs text-muted-foreground` إلى `text-sm font-semibold`
- جعل رقم التذكرة هو الرابط القابل للنقر بدلا من الصف كامل
- إزالة `cursor-pointer` و `onClick` من `TableRow` ونقل الرابط للرقم فقط

### 3. `src/components/services/MyServiceCard.tsx` (سطر 52)
- تغيير من `text-xs` إلى `text-sm font-semibold`
- لف الرقم بـ `Link` يوجه لصفحة تفاصيل الخدمة

### 4. `src/components/marketplace/ServiceCard.tsx` (سطر 51)
- تغيير من `text-[10px]` إلى `text-xs font-semibold`
- لف الرقم بـ `Link` يوجه لصفحة تفاصيل الخدمة

### 5. `src/pages/ServiceDetail.tsx` (سطر 70-72)
- تغيير من `text-sm text-muted-foreground` إلى `text-sm font-semibold text-primary`

### 6. `src/pages/MyDisputes.tsx` (سطر 158)
- تغيير من `text-xs` إلى `text-sm font-semibold`

### 7. `src/pages/admin/AdminDisputeDetail.tsx` (سطر 131)
- تغيير إلى `text-sm font-semibold text-primary`

## النمط الموحد
- جميع الأرقام: `font-mono text-sm font-semibold`
- الأرقام القابلة للنقر: اضافة `hover:underline hover:text-primary transition-colors`
- في صفحات الادارة: الرقم هو الرابط الرئيسي وليس العنوان
