

## خطة: رابط بروفايل الجمعية + نظام تعليقات العروض

### الميزة 1: رابط بروفايل الجمعية (حسب إعداد الأدمن)

**الفكرة:** عند عرض تفاصيل الطلب لمزود الخدمة، إذا كان `is_name_visible = true`، يظهر اسم الجمعية كرابط قابل للنقر يوجه لبروفايلها العام. إذا `false`، يظهر "جمعية مجهولة" بدون رابط.

**التعديلات:**

1. **`src/hooks/useAvailableProjects.ts`** — `useAvailableProject`: إضافة join على profiles للحصول على اسم الجمعية وصورتها:
   ```
   .select("*, categories(*), regions(*), cities(*), profiles:association_id(full_name, avatar_url, organization_name)")
   ```

2. **`src/pages/ProjectBidView.tsx`** — إضافة قسم يعرض معلومات الجمعية:
   - إذا `project.is_name_visible`: عرض اسم الجمعية + أيقونة + رابط `/profile/{association_id}`
   - إذا لا: عرض "جمعية مجهولة" بدون رابط

3. **`src/components/provider/ProviderProjectCard.tsx`** — نفس المنطق في بطاقة الطلب بقائمة الطلبات المتاحة

4. **`src/pages/AvailableProjects.tsx`** — تحديث الاستعلام ليشمل profiles join

---

### الميزة 2: نظام تعليقات/ردود على العروض (Bid Comments)

**الفكرة:** إضافة نظام محادثة على كل عرض بين الجمعية ومزود الخدمة. يتوقف عند قبول أو رفض العرض.

#### تغييرات قاعدة البيانات:
1. **جدول جديد `bid_comments`:**
   ```sql
   CREATE TABLE bid_comments (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     bid_id uuid NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
     author_id uuid NOT NULL,
     content text NOT NULL DEFAULT '',
     created_at timestamptz NOT NULL DEFAULT now()
   );
   ```

2. **RLS policies:**
   - SELECT: الجمعية (صاحبة المشروع) + مزود الخدمة (صاحب العرض) + الأدمن
   - INSERT: نفس الأطراف، بشرط أن العرض لا يزال `pending` وأن المستخدم غير معلق
   - لا UPDATE أو DELETE

3. **إشعار تلقائي (trigger):** عند إضافة تعليق جديد، يتم إرسال إشعار للطرف الآخر

#### تغييرات الكود:

1. **`src/hooks/useBidComments.ts`** (ملف جديد):
   - `useBidComments(bidId)` — جلب التعليقات مع بيانات الكاتب
   - `useAddBidComment()` — إضافة تعليق جديد

2. **`src/components/bids/BidCommentThread.tsx`** (ملف جديد):
   - عرض التعليقات بتنسيق محادثة (chat-like)
   - حقل إدخال + زر إرسال
   - يظهر فقط إذا العرض `pending`، وإلا يعرض التعليقات السابقة كقراءة فقط

3. **`src/components/bids/BidCard.tsx`** — إضافة زر "المحادثة" أو عرض `BidCommentThread` مباشرة أسفل العرض

---

### ملخص الملفات المتأثرة

| الملف | التعديل |
|---|---|
| Migration SQL | جدول `bid_comments` + RLS + trigger إشعارات |
| `src/hooks/useAvailableProjects.ts` | join profiles |
| `src/pages/AvailableProjects.tsx` | join profiles في الاستعلام |
| `src/pages/ProjectBidView.tsx` | عرض اسم الجمعية مع/بدون رابط |
| `src/components/provider/ProviderProjectCard.tsx` | عرض اسم الجمعية |
| `src/hooks/useBidComments.ts` | hook جديد |
| `src/components/bids/BidCommentThread.tsx` | مكون محادثة جديد |
| `src/components/bids/BidCard.tsx` | دمج المحادثة |

