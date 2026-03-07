

## تحليل وإصلاح مشكلة خلط اسم الجمعية باسم مسؤول التواصل

### المشكلة الجذرية
عند إنشاء حسابات الجمعيات (سواء عبر التسجيل أو `bulk-create-associations`)، يُخزَّن **اسم مسؤول التواصل** في حقل `full_name` بجدول `profiles`، بينما **اسم الجمعية** يُخزَّن في `organization_name`. المشكلة أن كثير من الصفحات تعرض `full_name` فقط بدون التحقق من `organization_name` أولاً، مما يؤدي لظهور اسم الشخص بدلاً من اسم الجمعية.

### الحل: إنشاء helper function + إصلاح شامل

**1. إنشاء دالة مساعدة `getDisplayName`** في `src/lib/utils.ts`:
```typescript
export function getDisplayName(profile: { organization_name?: string | null; full_name?: string | null } | null | undefined): string {
  return profile?.organization_name || profile?.full_name || "—";
}
```

**2. إصلاح الاستعلامات التي لا تجلب `organization_name`** — إضافته للـ select في:

| ملف | الاستعلام الحالي |
|---|---|
| `useAdminProjects.ts` | `profiles(full_name)` → يضاف `organization_name` |
| `useAdminDisputes.ts` | `profiles(full_name)` → يضاف `organization_name` |
| `useAdminTickets.ts` | `profiles(full_name)` → يضاف `organization_name` |
| `useAdminTicketById.ts` | `profiles(full_name, avatar_url)` → يضاف `organization_name` |
| `useBids.ts` | `profiles(full_name, avatar_url)` → يضاف `organization_name` |
| `useDisputeResponses.ts` | `profiles(full_name)` → يضاف `organization_name` |
| `useDisputeStatusLog.ts` | `profiles(full_name)` → يضاف `organization_name` |
| `useBidComments.ts` | `profiles(full_name, avatar_url)` → يضاف `organization_name` |
| `useContractVersions.ts` | `profiles(full_name)` → يضاف `organization_name` |
| `useMessages.ts` | `profiles(full_name, avatar_url)` → يضاف `organization_name` |
| `useLandingStats.ts` | provider queries → يضاف `organization_name` |
| Admin hooks various | needs `organization_name` added |

**3. إصلاح العرض في الواجهات** — استخدام `getDisplayName` أو `organization_name || full_name` في:

| الملف | السطر/المكان |
|---|---|
| `AdminProjects.tsx` | جدول الطلبات + فلتر البحث |
| `AdminProjectDetail.tsx` | اسم الجمعية في تفاصيل الطلب |
| `AdminDisputeDetail.tsx` | "بواسطة" في النزاعات |
| `AdminTickets.tsx` | جدول التذاكر |
| `DisputeCard.tsx` | "بواسطة" |
| `DisputeResponseThread.tsx` | اسم المرسل |
| `DisputeTimeline.tsx` | سجل الحالات |
| `BidCard.tsx` | اسم مقدم العرض |
| `BidPaymentDialog.tsx` | "مقدم الخدمة" |
| `BidCommentThread.tsx` | اسم المعلق |
| `ServiceApprovalCard.tsx` | اسم مقدم الخدمة |
| `ProjectDetails.tsx` | اسم مقدم الخدمة في العقد + النزاعات |
| `ContractVersionsList.tsx` | "تم التعديل بواسطة" |
| `ChatThread.tsx` | اسم المرسل |
| `ConversationList.tsx` | اسم المحادثة |
| `DashboardLayout.tsx` | الهيدر (موجود بالفعل ✓) |
| `TimeLogTable.tsx` | اسم المزود |

**4. إصلاح `bulk-create-associations`** — لا يحتاج تغيير لأن البيانات مخزنة صح (full_name = مسؤول التواصل، organization_name = اسم الجمعية). المشكلة في العرض فقط.

### ملاحظة
- الأماكن التي تستخدم `organization_name || full_name` بالفعل (مثل `DashboardLayout`, `ProviderProjectCard`, `ReceivedGrants`, `Donations`) **صحيحة ولا تحتاج تعديل**.
- المنطق: للجمعيات → `organization_name` أولاً. لمقدمي الخدمات → `full_name` (لأن `organization_name` عادةً فارغ لهم). الدالة `getDisplayName` تغطي الحالتين.

### الملفات المتأثرة
~20 ملف hooks + ~15 ملف واجهات = ~35 ملف يحتاج تعديل

