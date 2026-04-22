

## منع تقديم عروض الأسعار بدون نموذج عمل

### القاعدة الجديدة
لا يمكن لمزود الخدمة تقديم عرض سعر (Bid) على طلبات الجمعيات إلا إذا كان لديه:
1. حساب موثّق (`is_verified = true`) — موجود حالياً
2. **نموذج عمل واحد على الأقل في معرض الأعمال** — جديد

### التغييرات

**1. توسيع `useVerificationGuard.ts`**
- إضافة دالة جديدة `useBidGuard()` ترجع:
  - `canBid: boolean` = `is_verified && hasPortfolio` (للمزود فقط)
  - `blockReason: "verification" | "portfolio" | null`
  - `guardBid(callback)` يعرض رسالة مناسبة:
    - غير موثق → "يجب توثيق حسابك أولاً لتقديم عروض"
    - بدون أعمال → "يجب إضافة نموذج عمل واحد على الأقل في معرض الأعمال قبل تقديم العروض"
- إعادة استخدام منطق `useProfileCompleteness` الموجود الذي يجلب `portfolio_count` بالفعل، أو الاكتفاء بـ check مباشر بسيط (سنعيد استخدام `useProfileCompleteness` لأنه يحوي البيانات أصلاً)

**2. تطبيق `guardBid` في `src/pages/ProjectBidView.tsx`**
- استبدال `useVerificationGuard` الحالي بـ `useBidGuard`
- تعديل قسم "تقديم عرض" ليعرض رسائل تفصيلية بحسب `blockReason`:
  - زر "إكمال الملف الشخصي" → `/profile`
  - زر "إضافة نموذج عمل" → `/profile?tab=portfolio` (في حالة `portfolio`)
- إخفاء `BidForm` إذا `!canBid`

**3. لا تغيير في قاعدة البيانات**
الفحص فرونت-إند فقط (متسق مع الحماية الحالية للنشر). RLS الحالي يكفي للحماية الأمنية.

### الملفات المعدّلة
- `src/hooks/useVerificationGuard.ts` — إضافة `useBidGuard`
- `src/pages/ProjectBidView.tsx` — تطبيق الحارس الجديد + UI للرسائل

### بدون تأثير
- المتبرع/الجمعية/الأدمن: لا تأثير (الحماية مخصصة للمزود فقط)
- صفحات الشراء/التبرع: تبقى بـ `guardAction` الحالية (توثيق فقط)

