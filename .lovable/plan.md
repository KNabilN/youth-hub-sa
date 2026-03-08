

## إضافة شارة إشعار للخدمات المعلقة + تقييد تغيير الحالة للأدمن

### التغييرات المطلوبة

#### 1. إضافة عدّاد الخدمات المعلقة في الشريط الجانبي
**ملف: `src/components/AppSidebar.tsx`**

في قسم `super_admin` داخل `grantRequestsCounts` query (سطر ~219-235)، إضافة استعلام لعدد الخدمات بحالة `pending`:
```typescript
const { count: pendingServices } = await supabase
  .from("micro_services")
  .select("id", { count: "exact", head: true })
  .is("deleted_at", null)
  .eq("approval", "pending");
counts["/admin/services"] = pendingServices ?? 0;
```

هذا سيجعل `getBadge` يعرض الشارة تلقائياً على تبويب "الخدمات" في قائمة الأدمن.

#### 2. تقييد خيارات تغيير الحالة في صفحة إدارة الخدمات
**ملف: `src/pages/admin/AdminServices.tsx`**

تعديل dropdown تغيير الحالة (سطر ~210-215) بحيث:
- إذا كانت الخدمة `pending` → يظهر فقط: `approved` و `rejected`
- إذا كانت الخدمة `approved` → يظهر فقط: `suspended` (تعليق مؤقت)
- إذا كانت الخدمة `suspended` → يظهر فقط: `approved` (إعادة تفعيل)
- إذا كانت الخدمة `rejected` أو `draft` → لا يظهر dropdown (لا يمكن التغيير)

#### 3. نفس التقييد في `ServiceApprovalCard.tsx`
**ملف: `src/components/admin/ServiceApprovalCard.tsx`**

الأزرار الحالية (موافقة/رفض/تعليق/إعادة تفعيل) تحتاج تقييد مشابه — إخفاء أزرار الموافقة والرفض بعد أن تصبح الخدمة `approved`.

### الملفات المتأثرة
| # | الملف | التغيير |
|---|---|---|
| 1 | `src/components/AppSidebar.tsx` | إضافة عدّاد الخدمات المعلقة للأدمن |
| 2 | `src/pages/admin/AdminServices.tsx` | تقييد خيارات تغيير الحالة حسب الحالة الحالية |
| 3 | `src/components/admin/ServiceApprovalCard.tsx` | تقييد الأزرار حسب الحالة الحالية |

