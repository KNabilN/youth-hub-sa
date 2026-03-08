

## إصلاح مشكلة الوصول للعناصر المحذوفة من خلال الإشعارات

### المشكلة
عند حذف مشروع أو أي كيان (حذف ناعم)، لا يزال بإمكان المستخدم النقر على الإشعار المرتبط والانتقال إلى صفحة تفاصيل الكيان المحذوف. هذا يحدث لأن:

1. **`useProject(id)`** لا يفلتر `deleted_at IS NULL` — يعرض المشاريع المحذوفة
2. **صفحات التفاصيل** لا تتحقق من حالة الحذف وتعرض المحتوى بشكل طبيعي
3. **الإشعارات** لا تشير بأي شكل إلى أن الكيان المرتبط محذوف

### الحل (على مرحلتين)

#### المرحلة 1: منع عرض الكيانات المحذوفة في hooks التفاصيل

**`src/hooks/useProjects.ts`** — إضافة `.is("deleted_at", null)` في `useProject(id)`:
```typescript
const { data, error } = await supabase
  .from("projects")
  .select("*, categories(*), regions(*), cities(*)")
  .eq("id", id!)
  .is("deleted_at", null)  // ← إضافة هذا الفلتر
  .single();
```

نفس الشيء لأي hooks تفاصيل أخرى لا تفلتر بعد (contracts inline query في ProjectDetails, disputes, tickets).

#### المرحلة 2: تحسين تجربة المستخدم عند الانتقال لكيان محذوف

**`src/pages/ProjectDetails.tsx`** — عند عدم وجود المشروع (بعد التحميل)، عرض رسالة "تم حذف هذا الطلب" مع زر للعودة بدلاً من عرض صفحة فارغة أو خطأ.

**`src/pages/ServiceDetail.tsx`** — نفس المعالجة (موجود فعلاً `!service` check لكن الرسالة عامة).

**`src/components/notifications/NotificationItem.tsx`** — لا تغيير مطلوب هنا، الحل من جهة صفحات التفاصيل كافٍ.

### الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `src/hooks/useProjects.ts` | إضافة `deleted_at IS NULL` في `useProject()` |
| `src/pages/ProjectDetails.tsx` | تحسين رسالة "غير موجود" لتشمل الحذف مع زر عودة |
| `src/pages/ServiceDetail.tsx` | تحسين رسالة "غير موجود" |
| `src/pages/TicketDetail.tsx` | نفس الفحص |
| `src/pages/admin/AdminDisputeDetail.tsx` | نفس الفحص |

