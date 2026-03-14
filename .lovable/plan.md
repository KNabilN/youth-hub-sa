

# حفظ موضع التمرير وتظليل الصف عند العودة من التفاصيل

## الفكرة
عند النقر على عنصر في جدول إداري (مستخدمين، خدمات، طلبات، تذاكر، شكاوى) والانتقال لصفحة التفاصيل، ثم الضغط على "العودة"، يتم:
1. التمرير تلقائياً للعنصر الذي كان المستخدم يشاهده
2. تظليل الصف لثوانٍ قليلة ليسهل تمييزه

## الحل التقني

### 1. إنشاء hook مشترك `useListHighlight`
ملف جديد `src/hooks/useListHighlight.ts`:
- عند التنقل لصفحة التفاصيل: يحفظ `id` العنصر + موضع التمرير (`scrollY`) في `sessionStorage`
- عند العودة للقائمة: يقرأ الـ `id` المحفوظ، يمرر الصفحة للعنصر، ويضيف تأثير تظليل مؤقت
- يوفر دالة `navigateToDetail(id, path)` ودالة `getHighlightedId()` وref callback `highlightRef`

### 2. تحديث صفحات القوائم (5 ملفات)
- `src/components/admin/UserTable.tsx` — إضافة `id` attribute لكل `TableRow`، واستخدام الـ hook للتظليل
- `src/pages/admin/AdminProjects.tsx` — نفس النمط
- `src/pages/admin/AdminServices.tsx` — نفس النمط
- `src/pages/admin/AdminTickets.tsx` — نفس النمط (إن وُجد جدول)
- `src/pages/admin/AdminDisputes.tsx` — نفس النمط (إن وُجد جدول)

### 3. تحديث صفحات التفاصيل (5 ملفات)
- تغيير زر "العودة" من `navigate("/admin/xxx")` إلى `navigate(-1)` أو استخدام `navigate` مع state لضمان العودة للموضع الصحيح (بما في ذلك الصفحة والفلاتر)

### 4. تأثير التظليل (CSS)
إضافة animation في `src/index.css`:
```css
@keyframes row-highlight {
  0% { background-color: hsl(var(--primary) / 0.15); }
  100% { background-color: transparent; }
}
.row-highlight {
  animation: row-highlight 2s ease-out;
}
```

### آلية العمل
```text
القائمة → نقر على عنصر → حفظ {id, scrollY} في sessionStorage → صفحة التفاصيل
                                                                      ↓
القائمة ← العودة ← قراءة sessionStorage ← scrollTo + إضافة class "row-highlight" ← مسح sessionStorage
```

### الملفات المتأثرة
- `src/hooks/useListHighlight.ts` (جديد)
- `src/index.css` (إضافة animation)
- `src/components/admin/UserTable.tsx`
- `src/pages/admin/AdminProjects.tsx`
- `src/pages/admin/AdminServices.tsx`
- `src/pages/admin/AdminDisputes.tsx`
- `src/pages/admin/AdminTickets.tsx` (إن وُجد جدول بنفس النمط)
- `src/pages/admin/AdminUserDetail.tsx`
- `src/pages/admin/AdminProjectDetail.tsx`
- `src/pages/admin/AdminServiceDetail.tsx`
- `src/pages/admin/AdminDisputeDetail.tsx`
- `src/pages/admin/AdminTicketDetail.tsx`

