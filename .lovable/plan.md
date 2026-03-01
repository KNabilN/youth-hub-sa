

# Improve Admin Finance Page - UI Polish & Info Tooltips

## Changes

### 1. FinanceSummary.tsx - Better Wording + Info Tooltips

Update the summary cards with clearer Arabic labels and add an (i) icon tooltip to each card explaining what the metric means.

**Updated card definitions:**

| Current Label | New Label | Tooltip Description |
|---|---|---|
| الضمان المحتجز | الضمان المحتجز | مبالغ محجوزة بانتظار اكتمال الطلب وتأكيد التسليم |
| المجمد | الضمان المجمّد | مبالغ تم تجميدها مؤقتاً بسبب شكوى أو مراجعة إدارية |
| المبالغ المحررة | المبالغ المحرّرة | مبالغ تم تحريرها لمقدمي الخدمات بعد اكتمال الطلب بنجاح |
| المسترد | المبالغ المستردة | مبالغ تم إعادتها للجمعيات بعد إلغاء أو رفض الطلب |
| إجمالي العمولات | إيرادات العمولات | إجمالي العمولات المحصّلة من المنصة على جميع المعاملات المكتملة |
| عدد الفواتير | عدد الفواتير الصادرة | إجمالي عدد الفواتير الإلكترونية التي تم إصدارها عبر المنصة |

**Implementation:**
- Import `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` and `Info` icon from lucide-react
- Add a `description` field to each item in the items array
- Render a small `Info` icon wrapped in a Tooltip next to each card title
- Wrap the grid in `TooltipProvider`

### 2. AdminFinance.tsx - Page Header Enhancement

Update the page title from the plain `<h1>` to include a subtitle for context:
- Title: "النظرة المالية"
- Subtitle: "إدارة الضمان المالي والفواتير وطلبات السحب"

### Files to Edit
1. `src/components/admin/FinanceSummary.tsx` -- add tooltips, improve labels
2. `src/pages/admin/AdminFinance.tsx` -- improve header with description

