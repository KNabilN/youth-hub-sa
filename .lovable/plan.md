

# مراجعة شاملة للنظام — النتائج والتوصيات

## 1. أخطاء يجب إصلاحها فوراً

### 1.1 باغ: حوار حذف التذاكر يعرض "undefined"
**الملف**: `src/pages/admin/AdminTickets.tsx` سطر 203
**المشكلة**: رسالة التأكيد تستخدم `deleteTarget?.ticket_number` لكن في بعض الحالات بيانات التذكرة قد لا تحتوي على `ticket_number`. الأهم: Session replay يؤكد ظهور "undefined" في الحوار.
**الحل**: استخدام `deleteTarget?.ticket_number || deleteTarget?.subject || "—"` كـ fallback.

### 1.2 باغ: متغير `amount` غير معرّف في Edge Function
**الملف**: `supabase/functions/moyasar-verify-payment/index.ts` سطر 61
**المشكلة**: في دالة `createInvoiceAndNotifyAdmin` يتم استخدام المتغير `amount` في نص الإشعار، لكن المتغير ليس ضمن معاملات الدالة — المعامل اسمه `baseAmount`. هذا يعني إشعارات الأدمن عند الدفع الإلكتروني ستظهر "undefined ر.س".
**الحل**: تغيير `${amount}` إلى `${baseAmount}` في سطر 61.

### 1.3 باغ: عقود بدون فلتر `deleted_at`
**الملف**: `src/hooks/useContracts.ts`
**المشكلة**: استعلام العقود لا يفلتر `deleted_at IS NULL` رغم إضافة العمود. العقود المحذوفة ستظهر للمستخدمين.
**الحل**: إضافة `.is("deleted_at", null)` للاستعلام.

### 1.4 باغ: تقييمات بدون فلتر `deleted_at`
**المشكلة**: مثل العقود — أي hook يقرأ `ratings` أو `bids` يجب أن يفلتر `deleted_at`.

### 1.5 باغ: `getClaims()` غير موجود في Supabase JS v2
**الملف**: `supabase/functions/moyasar-verify-payment/index.ts` سطر 89
**المشكلة**: `supabase.auth.getClaims(token)` ليس API صالح. يجب استخدام `supabase.auth.getUser()` بدلاً.

---

## 2. قاعدة البيانات والاتصالات

| الجانب | الحالة | ملاحظة |
|---|---|---|
| RLS Policies | ✅ سليمة | كل الجداول محمية بـ RLS مع `has_role` + `is_not_suspended` |
| Soft Delete فلترة | ⚠️ ناقصة | `useContracts`, `useBids` (user-facing) لا تفلتر `deleted_at` |
| Triggers | ✅ شاملة | 23+ trigger تغطي الإشعارات والأرقام التسلسلية |
| Purge Function | ✅ محدّثة | تشمل كل الجداول الـ 10 |
| Admin Hooks | ✅ | كل hooks الأدمن تفلتر `deleted_at` بشكل صحيح |

---

## 3. واجهة المستخدم والتجاوبية (UI/UX)

| الجانب | الحالة | ملاحظة |
|---|---|---|
| RTL Support | ✅ | كامل — `me-`, `ms-`, sidebar `side="right"` |
| Tabs Overflow | ✅ | `overflow-x-auto` + `scrollbar-hide` مُطبق |
| Grid Responsive | ✅ | grids تستخدم `grid-cols-2 sm:grid-cols-3` |
| Loading States | ✅ | Skeleton loading في كل الصفحات |
| Empty States | ✅ | `EmptyState` component مستخدم |
| Admin Tables | ✅ | متجانسة: بحث + فلاتر + تصدير + pagination |
| Sidebar Badges | ✅ | عدادات ديناميكية للإشعارات والتذاكر والمالية |
| سلة المحذوفات | ✅ | Tabs + counts + restore/delete + confirm dialogs |
| Error Boundary | ✅ | موجود على مستوى الـ App |
| Lazy Loading | ✅ | كل الصفحات غير الأساسية lazy-loaded |

---

## 4. تدفقات الدفع

### الدفع الإلكتروني (Moyasar)
| الخطوة | الحالة | ملاحظة |
|---|---|---|
| تحميل مفتاح Moyasar | ✅ | عبر edge function آمن |
| PCI Compliance | ✅ | النموذج يُعرض عبر Moyasar SDK |
| Callback + 3DS | ✅ | Context مشفر في URL + sessionStorage fallback |
| Session Recovery | ✅ | 10 retries لاسترداد الجلسة بعد 3DS redirect |
| إشعارات الأدمن | ⚠️ | الإشعار يعرض "undefined ر.س" (باغ #1.2) |
| إصدار فواتير تلقائية | ✅ | تُصدر فوراً عند نجاح الدفع |
| مسح السلة | ✅ | يتم تلقائياً بعد نجاح الدفع |

### التحويل البنكي
| الخطوة | الحالة | ملاحظة |
|---|---|---|
| رفع الإيصال | ✅ | حد 5MB + storage bucket مؤمّن |
| إنشاء Escrow (pending_payment) | ✅ | |
| مراجعة الأدمن (approve/reject) | ✅ | مع إشعارات تلقائية |
| إصدار فاتورة عند الموافقة | ✅ | |
| إنشاء عقد تلقائي | ✅ | مع توقيع الجمعية التلقائي |
| الرفض مع ملاحظة | ✅ | يغير الـ escrow لـ "failed" |

---

## 5. تدفقات المستخدم الأساسية

| التدفق | الحالة |
|---|---|
| تسجيل → email verification → login | ✅ |
| جمعية: إنشاء طلب → موافقة → عروض → عقد → ضمان → تسليم → إتمام | ✅ |
| مزود: تصفح طلبات → تقديم عرض → توقيع عقد → تسجيل ساعات → سحب أرباح | ✅ |
| مانح: تصفح جمعيات → تبرع (إلكتروني/بنكي) → تقرير أثر | ✅ |
| مانح: شراء خدمة لجمعية → checkout → escrow → مشروع تلقائي | ✅ |
| نزاع → تجميد ضمان → حل → تحرير/استرداد | ✅ |
| الأدمن: حذف ناعم → سلة المحذوفات → استرجاع/حذف نهائي | ✅ |

---

## 6. ملخص التغييرات المطلوبة

| # | الملف | التغيير |
|---|---|---|
| 1 | `src/pages/admin/AdminTickets.tsx` | إصلاح "undefined" في رسالة حذف التذكرة |
| 2 | `supabase/functions/moyasar-verify-payment/index.ts` | إصلاح `amount` → `baseAmount` + إصلاح `getClaims` → `getUser` |
| 3 | `src/hooks/useContracts.ts` | إضافة `.is("deleted_at", null)` |
| 4 | `src/hooks/useBids.ts` (إن وُجد user-facing) | إضافة فلتر `deleted_at` |
| 5 | `src/hooks/useProviderBids.ts` | التحقق من فلتر `deleted_at` |

هذه الإصلاحات ضرورية لضمان سلامة البيانات المعروضة وصحة إشعارات الدفع.

