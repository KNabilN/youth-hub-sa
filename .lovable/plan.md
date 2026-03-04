

## خطة: إضافة شارات الإجراءات المعلقة على تبويب المالية

### المنطق

العناصر التي تحتاج إجراء (موافقة/رفض):
- **الضمان**: حالة `pending_payment` أو `under_review`
- **طلبات السحب**: حالة `pending`
- **التحويلات البنكية**: حالة `pending`
- **الفواتير**: لا يوجد إجراء معلق (سجلات فقط)

### التغييرات

#### 1. إنشاء hook جديد `useAdminFinancePending`
- يحسب عدد السجلات المعلقة لكل تبويب بـ 3 استعلامات `count` خفيفة
- يُعيد كائن `{ escrow, withdrawals, bankTransfers, total }`

#### 2. شارة على "المالية" في القائمة الجانبية (`AppSidebar.tsx`)
- إضافة `/admin/finance` ضمن `getBadge` باستخدام `total` من الـ hook الجديد

#### 3. شارات على التبويبات الأربعة (`AdminFinance.tsx`)
- عرض Badge داخل كل `TabsTrigger` بعدد السجلات المعلقة لكل تبويب

### الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/hooks/useAdminFinancePending.ts` | hook جديد |
| `src/components/AppSidebar.tsx` | شارة على رابط المالية |
| `src/pages/admin/AdminFinance.tsx` | شارات على التبويبات |

