

# تحسين دعم RTL الكامل ومراجعة أمان البيانات (RLS)

## الجزء الأول: تصحيح اتجاه RTL في المكونات

التطبيق يحتوي بالفعل على `dir="rtl"` في `index.html` و `direction: rtl` في CSS، لكن هناك أكثر من 70 ملف يستخدم خصائص CSS ثابتة الاتجاه بدلاً من الخصائص المنطقية. هذا يسبب انعكاسات خاطئة في الواجهة.

### التغييرات المطلوبة:

#### 1. استبدال الخصائص الثابتة بالمنطقية في مكونات التطبيق
- `ml-` -> `ms-` (margin-inline-start)
- `mr-` -> `me-` (margin-inline-end)
- `pl-` -> `ps-` (padding-inline-start)
- `pr-` -> `pe-` (padding-inline-end)
- `left-` -> `start-` / `right-` -> `end-`
- `border-l-` -> `border-s-` / `border-r-` -> `border-e-`
- `text-left` -> `text-start` / `text-right` -> `text-end`
- `space-x-` -> `space-x-reverse` او استخدام `gap-`

#### 2. الملفات الرئيسية المتأثرة (أهم الملفات):

**مكونات الواجهة (`src/components/`):**
- `AppSidebar.tsx` - تغيير `border-l-[3px]` إلى `border-s-[3px]` للعنصر النشط
- `DashboardLayout.tsx` - مراجعة ترتيب العناصر في الهيدر
- `projects/ProjectCard.tsx` - تغيير `ml-1` و `ml-2` إلى `ms-1` و `ms-2`
- `projects/ProjectForm.tsx` - تغيير `mr-auto` إلى `me-auto`
- `donor/DonationTimeline.tsx` - تغيير `right-4` إلى `end-4`

**مكونات UI الأساسية (`src/components/ui/`):**
- `dialog.tsx` - تغيير `space-x-2` إلى `gap-2`
- `alert-dialog.tsx` - تغيير `text-left` إلى `text-start` و `space-x-2` إلى `gap-2`
- `sheet.tsx` - تغيير `space-x-2` إلى `gap-2`
- `toast.tsx` - تغيير `space-x-4` إلى `gap-4` و `pr-8` إلى `pe-8`
- `calendar.tsx` - تغيير `space-x-` إلى `gap-` مع RTL support
- `navigation-menu.tsx` - تغيير `space-x-1` إلى `gap-1`
- `menubar.tsx` - تغيير `space-x-1` إلى `gap-1`

**صفحات (`src/pages/`):**
- `ProjectBidView.tsx` - تغيير `ml-2` إلى `ms-2`
- `SupportTickets.tsx` - تغيير `ml-2` إلى `ms-2`
- جميع الصفحات التي تحتوي على أيقونات بجانب نص

#### 3. مكونات أخرى تحتاج مراجعة
- جميع الأزرار التي تحتوي على أيقونة + نص (حوالي 30+ مكان)
- مكونات البطاقات والقوائم
- مكونات الجداول والفلاتر

---

## الجزء الثاني: مراجعة أمان البيانات (RLS)

بعد مراجعة شاملة لجميع الجداول وسياسات RLS:

### الحالة الحالية - جيدة:
جميع الجداول الـ 22 مفعّل عليها RLS مع سياسات مناسبة:
- `profiles` - المستخدم يرى ملفه فقط + الأدمن يرى الجميع
- `projects` - الجمعية تدير مشاريعها + مقدم الخدمة يرى المفتوحة فقط
- `bids` - مقدم الخدمة يدير عروضه + الجمعية ترى عروض مشاريعها
- `contracts`, `messages`, `time_logs` - مقيدة بأطراف المشروع
- `escrow_transactions`, `invoices` - مقيدة بالدافع/المستفيد
- `disputes` - مقيدة بالأطراف المعنية
- `audit_log` - قراءة فقط للأدمن

### ملاحظات أمنية بسيطة للتحسين:
1. **جدول `invoices`** - سياسة INSERT واسعة نسبياً (`auth.uid() IS NOT NULL`) يمكن تضييقها
2. **جدول `notifications`** - سياسة INSERT تسمح لأي مستخدم مسجل بإدراج إشعارات - مقبولة لأن triggers النظام تستخدمها

### لا تغييرات مطلوبة على RLS:
السياسات الحالية تغطي جميع السيناريوهات بشكل صحيح. كل hook في التطبيق يستخدم `user?.id` للفلترة مع `enabled: !!user`.

---

## ملخص العمل

| المهمة | عدد الملفات | الأولوية |
|--------|------------|----------|
| تصحيح margins/padding (ms/me/ps/pe) | ~40 ملف | عالية |
| تصحيح border directions (border-s/e) | ~10 ملفات | عالية |
| تصحيح space-x في مكونات UI | ~7 ملفات | عالية |
| تصحيح text-left/right | ~5 ملفات | متوسطة |
| تصحيح positioning (start/end) | ~8 ملفات | متوسطة |
| مراجعة RLS | لا تغييرات | مكتملة |

