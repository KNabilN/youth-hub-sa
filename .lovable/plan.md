## الموجة 1 — إصلاحات DB حرجة

### 1.1 استبدال `.single()` بـ `.maybeSingle()`
أفحص جميع المواضع (≈30) وأستبدلها حيث لا يكون الصفّ مضموناً (profile, bank_details, cart, public profile لمستخدم محذوف، إلخ). أحافظ على `.single()` فقط حين يكون الصفّ مضموناً منطقياً (مثل ربط بعقد قائم من نفس الـ mutation).

### 1.2 ضبط افتراضيات React Query
- إضافة `staleTime: 30_000` و `gcTime: 5*60_000` افتراضياً على `QueryClient` في `src/main.tsx`/`App.tsx`.
- منع `refetchOnWindowFocus` المفرط على القوائم الثقيلة.

### 1.3 توحيد invalidation للطفرات الشائعة
مراجعة الـ mutations التالية وإضافة المفاتيح المرتبطة الناقصة:
- `useUpdateProfile` ← يضيف `["bank-details"]`, `["public-profile", id]`.
- mutations العقود ← يبطل `["contracts"]`, `["my-projects"]`.
- mutations cart ← يبطل عدّاد الـ header.
- mutations الإشعارات ← يبطل `["unread-count"]`.

### 1.4 `overflow-x-auto` للجداول الإدارية
إضافة wrapper في 8 صفحات: `AdminTickets, AdminServices, AdminProjects, AdminContracts, AdminDisputes, AdminDiscountCodes, AdminEditRequests, AssociationImpactReports`.

---

## الموجة 2 — توحيد التوكنات (UI consistency)

### 2.1 استبدال الألوان المباشرة بالتوكنات الدلالية
ألوان مكتشفة في 28 ملفاً. الخريطة المعتمدة:

| المباشر | البديل الدلالي |
|---|---|
| `text-white` (على خلفيات ملوّنة) | `text-primary-foreground` / `text-destructive-foreground` |
| `bg-white` | `bg-card` أو `bg-background` |
| `text-gray-{500-700}` | `text-muted-foreground` |
| `text-gray-{800-900}` | `text-foreground` |
| `bg-gray-{50-100}` | `bg-muted` |
| `text-red-{500-600}` / `bg-red-{50-100}` | `text-destructive` / `bg-destructive/10` |
| `text-green-{500-700}` / `bg-green-{50-100}` | `text-success` / `bg-success/10` |
| `text-yellow-/amber-` | `text-warning` / `bg-warning/10` |
| `text-blue-{500-700}` / `bg-blue-` | `text-info` (أو `text-primary`) / `bg-info/10` |

### 2.2 ملفات التركيز
سأطبّق التغييرات بصورة مدروسة على:
- **صفحات إدارية**: `AdminTickets, AdminTicketDetail, AdminProjects, AdminProjectDetail, AdminReports, AdminDisputeDetail, AdminFinance`
- **مكوّنات أساسية**: `DashboardLayout, ContractTimeline, ContractCard, TicketCard, ServiceApprovalCard, FinanceSummary, WithdrawalEscrowDetails, DeliverablePanel`
- **صفحات مستخدم**: `Profile, ServiceDetail, ProjectDetails, TimeTracking, Earnings, ReceivedGrants, TicketDetail, Index`
- **landing/payment**: `LandingFooter, LandingServicesGrid, MoyasarPaymentForm, ServiceForm`

### 2.3 ضمانات
- لا تغيير في السلوك أو البنية — فقط classes.
- التحقق من الـ contrast بصرياً (الخلفية مقابل foreground).
- لا أمسّ مكتبة `src/components/ui/**` (shadcn).

---

## ما لن يدخل في هذه الموجتين
- توحيد toast vs sonner (الموجة 3).
- حالات فارغة موحّدة (الموجة 3).
- responsive breakpoints (الموجة 4).
- RTL (`ms-`/`me-`) (الموجة 4).
- تحسينات تدفقات (الموجة 5).

---

## التحقّق بعد التنفيذ
- لا أخطاء TS من البناء التلقائي.
- جولة سريعة على الصفحات الأكثر تأثراً للتأكد من عدم وجود تعارض ألوان.
- أوافيك بقائمة الملفات المعدّلة وعدد الاستبدالات.