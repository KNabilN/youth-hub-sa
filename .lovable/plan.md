

# خطة إنشاء صفحات تفصيلية للخدمات والطلبات (Service & Project Detail Pages)

## الهدف
إنشاء صفحة تفصيلية عامة لكل خدمة وطلب، مشابهة لصفحة الموقع القديم، تتضمن: معرض صور، وصف تفصيلي، أسئلة متكررة، باقات أسعار، معلومات مقدم الخدمة، تقييمات، ومشاهدات. مع اتباع نظام التصميم الحالي للمنصة.

---

## الوضع الحالي

- **الخدمات:** لا توجد صفحة تفصيلية - بطاقة الخدمة (ServiceCard) تضيف مباشرة للسلة بدون إمكانية عرض التفاصيل
- **الطلبات:** صفحة التفاصيل (`ProjectDetails`) موجودة لكن داخلية (Dashboard) وليست عامة
- **قاعدة البيانات:** جدول `micro_services` يحتوي على حقل صورة واحدة فقط (`image_url`)، ولا توجد حقول للأسئلة المتكررة أو الباقات أو المعرض أو عدد المشاهدات

---

## التغييرات المطلوبة

### 1. تحديث قاعدة البيانات (Migration)

**إضافة حقول جديدة لجدول `micro_services`:**
- `gallery` (jsonb, default '[]') - معرض صور (مصفوفة روابط)
- `faq` (jsonb, default '[]') - الأسئلة المتكررة (مصفوفة {question, answer})
- `packages` (jsonb, default '[]') - باقات الأسعار (مصفوفة {name, description, price, old_price?})
- `long_description` (text, default '') - وصف تفصيلي طويل
- `service_views` (integer, default 0) - عدد المشاهدات
- `sales_count` (integer, default 0) - عدد المبيعات

**إنشاء دالة RPC لزيادة المشاهدات:**
```text
increment_service_views(s_id uuid) - SECURITY DEFINER
```

**تحديث trigger المبيعات:**
عند إضافة escrow_transaction بـ service_id، يتم زيادة sales_count تلقائياً.

### 2. صفحة تفاصيل الخدمة (Service Detail Page)

إنشاء صفحة `src/pages/ServiceDetail.tsx` على المسار `/services/:id`:
- **متاحة بدون تسجيل دخول** (عبر PublicLayout)
- **متاحة أيضاً للمستخدمين المسجلين** (عبر ProtectedRoute كـ fallback)

**هيكل الصفحة (يتبع تصميم المنصة الحالي):**

```text
+--------------------------------------------------+
| Header (PublicLayout)                             |
+--------------------------------------------------+
| عنوان الخدمة                                      |
| [تقييم] [مشاهدات] [مبيعات] [حفظ]                 |
+--------------------------------------------------+
|                          |                        |
| [معرض الصور - Carousel]  | باقات الأسعار          |
| صورة رئيسية + thumbnails | (Tabs لكل باقة)        |
|                          | السعر + وصف + زر شراء  |
|                          |                        |
|                          | معلومات مقدم الخدمة    |
|                          | [صورة + اسم + تقييم]   |
|                          | [زر: عرض الملف الشخصي] |
+--------------------------------------------------+
| وصف الخدمة (تفصيلي)                              |
+--------------------------------------------------+
| الأسئلة المتكررة (Accordion)                      |
+--------------------------------------------------+
| التقييمات والمراجعات                              |
+--------------------------------------------------+
| Footer                                            |
+--------------------------------------------------+
```

**المكونات الفرعية:**
- `ServiceGallery` - معرض صور بأسلوب carousel مع thumbnails (باستخدام embla-carousel الموجود)
- `ServicePackages` - باقات الأسعار كـ Tabs مع السعر القديم والجديد
- `ServiceProviderCard` - بطاقة مقدم الخدمة المصغرة
- `ServiceFAQ` - أسئلة متكررة بنظام Accordion

### 3. صفحة تفاصيل الطلب العامة (Public Project Detail)

إنشاء صفحة `src/pages/ProjectPublicView.tsx` على المسار `/projects/public/:id`:
- **متاحة للمستخدمين المسجلين** فقط (مزودي خدمة + جمعيات + داعمين)
- تعرض تفاصيل الطلب بشكل احترافي مع إمكانية تقديم عرض

**هيكل الصفحة:**
```text
+--------------------------------------------------+
| عنوان الطلب + التصنيف + المنطقة                   |
+--------------------------------------------------+
| الوصف التفصيلي                                    |
| الميزانية | الساعات المقدرة | المهارات المطلوبة    |
+--------------------------------------------------+
| معلومات الجمعية (بطاقة مصغرة + رابط للملف العام)  |
+--------------------------------------------------+
| نموذج تقديم العرض (للمزودين)                      |
+--------------------------------------------------+
```

### 4. تحديث نموذج إنشاء/تعديل الخدمة

تحديث `src/components/services/ServiceForm.tsx` لإضافة:
- **معرض الصور:** رفع حتى 5 صور إضافية (gallery)
- **الوصف التفصيلي:** حقل textarea كبير (long_description)
- **الأسئلة المتكررة:** إضافة/حذف أسئلة ديناميكياً (faq)
- **باقات الأسعار:** إضافة/حذف باقات ديناميكياً (packages)

### 5. تحديث التوجيه (Routing)

```text
/services/:id  -> صفحة تفاصيل الخدمة (عامة، PublicLayout)
```

تحديث `ServiceCard` لإضافة رابط "عرض التفاصيل" يوجه إلى `/services/:id`

### 6. تحديث بطاقة الخدمة (ServiceCard)

- إضافة زر/رابط "عرض التفاصيل" بجانب "أضف إلى السلة"
- عرض التقييم والمبيعات على البطاقة

---

## التفاصيل التقنية

### الملفات الجديدة:
1. `src/pages/ServiceDetail.tsx` - صفحة تفاصيل الخدمة
2. `src/components/services/ServiceGallery.tsx` - معرض الصور
3. `src/components/services/ServicePackages.tsx` - باقات الأسعار
4. `src/components/services/ServiceProviderCard.tsx` - بطاقة المزود
5. `src/components/services/ServiceFAQ.tsx` - الأسئلة المتكررة
6. `src/hooks/useServiceDetail.ts` - hook لجلب بيانات الخدمة + المزود + التقييمات

### الملفات المعدلة:
1. `src/components/services/ServiceForm.tsx` - إضافة حقول المعرض والباقات والأسئلة
2. `src/components/marketplace/ServiceCard.tsx` - إضافة رابط التفاصيل
3. `src/App.tsx` - إضافة route جديد
4. `src/integrations/supabase/types.ts` - (تلقائي بعد migration)

### Migration SQL:
```text
ALTER TABLE micro_services ADD COLUMN gallery jsonb DEFAULT '[]';
ALTER TABLE micro_services ADD COLUMN faq jsonb DEFAULT '[]';
ALTER TABLE micro_services ADD COLUMN packages jsonb DEFAULT '[]';
ALTER TABLE micro_services ADD COLUMN long_description text DEFAULT '';
ALTER TABLE micro_services ADD COLUMN service_views integer DEFAULT 0;
ALTER TABLE micro_services ADD COLUMN sales_count integer DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_service_views(s_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
  UPDATE micro_services 
  SET service_views = COALESCE(service_views, 0) + 1 
  WHERE id = s_id;
$$;

-- Trigger to auto-increment sales_count on escrow creation
CREATE OR REPLACE FUNCTION increment_service_sales()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.service_id IS NOT NULL THEN
    UPDATE micro_services 
    SET sales_count = COALESCE(sales_count, 0) + 1 
    WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_escrow_increment_sales
  AFTER INSERT ON escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION increment_service_sales();
```

### ترتيب التنفيذ:
1. Migration (إضافة الحقول + الدوال + الـ trigger)
2. إنشاء hook useServiceDetail
3. بناء المكونات الفرعية (Gallery, Packages, FAQ, ProviderCard)
4. بناء صفحة ServiceDetail
5. تحديث ServiceForm (إضافة حقول التعديل)
6. تحديث ServiceCard + Routing
7. اختبار التدفق الكامل

