

## خطة تنفيذ 7 تعديلات على النظام

---

### 1. إشعار على الفواتير عند وجود فاتورة جديدة

**المشكلة:** لا يوجد إشعار في السايدبار على تبويب "الفواتير" عند وجود فواتير جديدة.

**الحل:**
- إضافة استعلام في `AppSidebar.tsx` لعد الفواتير التي بحالة `issued` (لم تُعرض بعد)
- عند دخول صفحة `/invoices`، تحديث حالة الفواتير من `issued` إلى `viewed` تلقائياً
- إضافة شارة على تبويب "الفواتير" في السايدبار لكل الأدوار

**الملفات:** `AppSidebar.tsx`, `Invoices.tsx`

---

### 2. تحديث الصفحة تلقائياً عند النقر على الإشعار (Realtime)

**المشكلة:** عند النقر على إشعار والانتقال للصفحة، البيانات لا تتحدث إلا بعد refresh.

**الحل:**
- إضافة `queryClient.invalidateQueries` عند النقر على الإشعار في `NotificationItem.tsx` لإعادة تحميل بيانات الصفحة المستهدفة
- تفعيل Realtime على جداول إضافية: `contracts`, `time_logs`, `invoices`, `escrow_transactions`
- إضافة اشتراك realtime في `ProjectDetails.tsx` لجدول projects (موجود بالفعل للأدمن، يُضاف لكل المستخدمين)

**الملفات:** `NotificationItem.tsx`, `ProjectDetails.tsx`, migration SQL

---

### 3. تحسين سجل النشاط (Activity Log) ليعرض بيانات مقروءة

**المشكلة:** المكون يعرض أسماء الحقول بالإنجليزية وقيم خام (UUIDs, timestamps).

**الحل:**
- إضافة خريطة ترجمة لأسماء الحقول الشائعة (`status` → "الحالة", `title` → "العنوان", إلخ)
- تصفية الحقول غير المهمة (مثل `deleted_at`, UUIDs)
- ترجمة قيم الحالات (`open` → "مفتوح", `in_progress` → "قيد التنفيذ")
- اختصار القيم الطويلة وإخفاء JSONs الكبيرة

**الملفات:** `EntityActivityLog.tsx`

---

### 4. شارة إشعار على "العقود" لمزود الخدمة

**المشكلة:** مزود الخدمة لا يرى أن هناك عقد يحتاج توقيعه.

**الحل:**
- إضافة استعلام في `AppSidebar.tsx` لعد العقود التي `provider_signed_at IS NULL` لمزود الخدمة
- عرض شارة على تبويب "العقود" (`/contracts`)

**الملفات:** `AppSidebar.tsx`

---

### 5. منع مزود الخدمة من العمل قبل توقيع العقد

**المشكلة:** مزود الخدمة يمكنه تسجيل ساعات وتسليم ملفات قبل توقيع العقد.

**الحل:**
- في `ProjectDetails.tsx`، التحقق من أن العقد موقّع من الطرفين قبل إظهار نماذج تسجيل الساعات والتسليمات
- عرض تنبيه واضح "يجب توقيع العقد أولاً" بدلاً من النماذج
- الشرط: `contract?.association_signed_at && contract?.provider_signed_at`

**الملفات:** `ProjectDetails.tsx`

---

### 6. إشعار للجمعية عند تسجيل ساعات جديدة

**المشكلة:** لا يوجد trigger يُرسل إشعاراً للجمعية عند INSERT في time_logs.

**الحل:**
- تحديث دالة `notify_on_timelog_approval` لتشمل `TG_OP = 'INSERT'` بالإضافة إلى UPDATE
- تعديل الـ trigger ليعمل على `AFTER INSERT OR UPDATE` بدلاً من `AFTER UPDATE` فقط
- إضافة نوع إشعار `timelog_submitted` في `NotificationItem.tsx`

**الملفات:** Migration SQL, `NotificationItem.tsx`

---

### 7. عرض سبب رفض الساعات لمزود الخدمة

**المشكلة:** `onReject` في `ProjectDetails.tsx` لا يمرر `reason` للـ mutation.

**الحل:**
- إصلاح `onReject` في `ProjectDetails.tsx` (سطر 611) ليستقبل `(logId, reason)` ويمرر `rejectionReason: reason`
- سبب الرفض يُعرض بالفعل في `TimeLogTable.tsx` (سطر 82-93) — لا تعديل إضافي

**الملفات:** `ProjectDetails.tsx`

---

### ملخص الملفات المتأثرة

| الملف | التعديلات |
|---|---|
| `src/components/AppSidebar.tsx` | شارة فواتير + شارة عقود |
| `src/pages/Invoices.tsx` | تحديث حالة الفواتير لـ viewed عند الدخول |
| `src/components/notifications/NotificationItem.tsx` | invalidate queries عند النقر + نوع timelog_submitted |
| `src/pages/ProjectDetails.tsx` | منع العمل قبل التوقيع + إصلاح onReject + realtime |
| `src/components/admin/EntityActivityLog.tsx` | ترجمة الحقول والقيم |
| Migration SQL | تفعيل Realtime لجداول + تحديث trigger الساعات |

