

## خطة: تحسين تصميم محادثة العرض + إصلاح التنقل من الإشعارات

### المشكلتان
1. **تصميم المحادثة**: `BidCommentThread` بسيط جداً مقارنة بـ `ChatThread` — فقاعات باهتة، لا auto-scroll، لا `ScrollArea`
2. **إشعارات تعليقات العرض**: الـ trigger يرسل `entity_type: 'bid'` لكن `NotificationItem.getEntityLink()` لا يتعامل مع نوع `bid` — فالإشعار لا ينقل لأي مكان

### التعديلات

#### 1. `src/components/bids/BidCommentThread.tsx` — إعادة تصميم كاملة
- فقاعات `rounded-2xl` مع `bg-primary text-primary-foreground` للمستخدم الحالي و`bg-muted` للطرف الآخر (نفس نمط ChatThread)
- `ScrollArea` بارتفاع ثابت بدل `overflow-y-auto`
- Auto-scroll لآخر رسالة عند التحميل وعند إرسال رسالة جديدة (`useEffect` + `scrollRef`)
- اسم المرسل فوق الفقاعة + وقت بـ `formatDistanceToNow` بالعربي
- حالة فارغة محسّنة بأيقونة `MessageCircle` + نص
- `Input` في سطر واحد بدل `Textarea` مع form submit

#### 2. `src/components/notifications/NotificationItem.tsx` — إضافة نوع `bid`
- إضافة `bid_comment` في `typeConfig` بأيقونة `MessageCircle` ولابل "تعليق على عرض"
- إضافة `case "bid"` في `getEntityLink`:
  - المشكلة: الإشعار يحتوي على `bid_id` لكن الصفحة تعرض العروض ضمن المشروع `/projects/{projectId}`
  - الحل: جلب `project_id` من جدول `bids` عند النقر على الإشعار، ثم التنقل لـ `/projects/{projectId}`
  - سيتم تحويل `getEntityLink` لتكون async عند نوع `bid` — أو الأبسط: تعديل الـ trigger ليرسل `entity_type: 'project'` و`entity_id: project_id` بدل `bid_id`

**القرار الأفضل**: تعديل trigger `notify_on_bid_comment` ليرسل `entity_type: 'project'` و`entity_id: project_id` — هذا يجعل الإشعار ينقل مباشرة لصفحة المشروع حيث تظهر العروض والمحادثة، بدون أي fetch إضافي عند النقر.

#### 3. Migration: تعديل trigger `notify_on_bid_comment`
```sql
-- تغيير entity_type من 'bid' إلى 'project' و entity_id من bid_id إلى project_id
```

### الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `src/components/bids/BidCommentThread.tsx` | إعادة تصميم كاملة (فقاعات، ScrollArea، auto-scroll) |
| `src/components/notifications/NotificationItem.tsx` | إضافة `bid_comment` في typeConfig |
| DB Migration | تعديل trigger `notify_on_bid_comment` ليرسل project entity |

