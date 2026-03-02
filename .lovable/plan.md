
# اضافة امكانية ارفاق ملفات في جميع النماذج

## الوضع الحالي
النظام يدعم المرفقات حالياً في: المشاريع، العقود، تذاكر الدعم، والشكاوى.

## النماذج التي تحتاج اضافة مرفقات

| النموذج | الصفحة | نوع الكيان |
|---------|--------|-----------|
| انشاء طلب جديد | ProjectCreate | project (موجود) |
| تقديم عرض | ProjectBidView | bid (جديد) |
| انشاء خدمة | MyServices | service (جديد) |

## التغييرات المطلوبة

### 1. تحديث قاعدة البيانات
- اضافة entity_type جديدة "bid" و "service" في RLS policies لجدول attachments
- تحديث سياسة "Users view related attachments" لتشمل:
  - `bid`: يمكن لصاحب العرض ولصاحب المشروع رؤية المرفقات
  - `service`: يمكن لصاحب الخدمة رؤية المرفقات (والعامة للخدمات المعتمدة)

### 2. تحديث `src/hooks/useAttachments.ts`
- توسيع `EntityType` ليشمل `"bid" | "service"`

### 3. تحديث صفحة انشاء الطلب (`ProjectCreate.tsx`)
- بعد انشاء الطلب بنجاح، اظهار قسم ارفاق الملفات مع `FileUploader` و `AttachmentList` (نفس نمط TicketCreate)

### 4. تحديث صفحة تقديم العرض (`ProjectBidView.tsx`)
- تعديل `useSubmitBid` ليُرجع الـ id بعد الانشاء
- بعد تقديم العرض بنجاح، اظهار قسم ارفاق الملفات بدل التوجيه مباشرة

### 5. تحديث صفحة الخدمات (`MyServices.tsx`)
- تعديل `useCreateService` ليُرجع الـ id بعد الانشاء
- بعد انشاء الخدمة بنجاح، اظهار قسم ارفاق الملفات مع رابط للانتقال للخدمات

### 6. اظهار المرفقات في صفحات التفاصيل
- اضافة `AttachmentList` في صفحة تفاصيل الخدمة (`ServiceDetail.tsx`)
- اضافة `AttachmentList` في بطاقات العروض (`BidCard.tsx`) او صفحة عروضي

## التفاصيل التقنية

### Migration SQL
```sql
-- تحديث سياسة RLS لعرض المرفقات لتشمل bid و service
DROP POLICY IF EXISTS "Users view related attachments" ON attachments;
CREATE POLICY "Users view related attachments" ON attachments FOR SELECT TO authenticated
USING (
  (user_id = auth.uid())
  OR (entity_type = 'project' AND EXISTS (SELECT 1 FROM projects p WHERE p.id = attachments.entity_id AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())))
  OR (entity_type = 'contract' AND EXISTS (SELECT 1 FROM contracts c WHERE c.id = attachments.entity_id AND (c.association_id = auth.uid() OR c.provider_id = auth.uid())))
  OR (entity_type = 'ticket' AND EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = attachments.entity_id AND t.user_id = auth.uid()))
  OR (entity_type = 'dispute' AND EXISTS (SELECT 1 FROM disputes d JOIN projects p ON p.id = d.project_id WHERE d.id = attachments.entity_id AND (d.raised_by = auth.uid() OR p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())))
  OR (entity_type = 'bid' AND EXISTS (SELECT 1 FROM bids b JOIN projects p ON p.id = b.project_id WHERE b.id = attachments.entity_id AND (b.provider_id = auth.uid() OR p.association_id = auth.uid())))
  OR (entity_type = 'service' AND EXISTS (SELECT 1 FROM micro_services ms WHERE ms.id = attachments.entity_id AND ms.provider_id = auth.uid()))
);
```

### نمط UI متسق
كل نموذج بعد الانشاء بنجاح يعرض:
1. رسالة نجاح
2. قسم "ارفاق ملفات" مع FileUploader و AttachmentList
3. رابط للانتقال للصفحة التالية
