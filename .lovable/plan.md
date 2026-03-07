

## إصلاح محادثة العروض (Bid Comments)

### المشكلة الجذرية
جدول `bid_comments` لا يحتوي على Foreign Key من `author_id` إلى `profiles.id`. عند تنفيذ استعلام Supabase:
```
.select("*, profiles:author_id(full_name, avatar_url, organization_name)")
```
PostgREST يحتاج FK لحل الـ join — بدونه الاستعلام يفشل والتعليقات تظهر فارغة أو "تتمسح".

### التغييرات المطلوبة

| # | النوع | التفاصيل |
|---|---|---|
| 1 | **Migration** | إضافة FK: `ALTER TABLE bid_comments ADD CONSTRAINT bid_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id)` + تفعيل Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE bid_comments` |
| 2 | **`useBidComments.ts`** | إضافة Realtime subscription للتعليقات الجديدة (invalidate on INSERT) + إزالة `.select().single()` من mutation لأنها غير ضرورية وممكن تسبب مشاكل |
| 3 | **`BidCommentThread.tsx`** | تحسين الشكل: رسالة فارغة أوضح، حجم أكبر لمنطقة الرسائل، تحسين تباين الألوان، إظهار حالة الإرسال |
| 4 | **`BidCard.tsx`** | تحسين تبويبات المرفقات/المحادثة بشكل tabs واضحة بدل أزرار منفصلة |

### سياسات الأمان (RLS)
السياسات الحالية صحيحة — التعليقات مرئية فقط للجمعية (صاحبة المشروع) ومقدم الخدمة (صاحب العرض) + الأدمن. لا حاجة لتعديلها.

### الملفات المتأثرة
- Migration جديد (FK + Realtime)
- `src/hooks/useBidComments.ts`
- `src/components/bids/BidCommentThread.tsx`
- `src/components/bids/BidCard.tsx`

