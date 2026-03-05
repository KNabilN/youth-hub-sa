

# خطة التنفيذ

## 1. تبديل ترتيب الأقسام في الصفحة الرئيسية

**ملف:** `src/pages/Index.tsx`

تبديل ترتيب القسمين بحيث تظهر **طلبات الجمعيات** (سطر 134) قبل **الخدمات المتوفرة** (سطر 131):

```
{/* 4. طلبات الجمعيات */}
<LandingRequestsTable ... />

{/* 5. الخدمات المتوفرة */}
<LandingServicesGrid ... />
```

## 2. إضافة عمود ترتيب للخدمات (`display_order`)

**Migration SQL:**
- إضافة عمود `display_order integer default 0` لجدول `micro_services`

## 3. تحديث استعلام الخدمات للترتيب حسب `display_order`

**ملف:** `src/hooks/useLandingStats.ts`

تغيير `.order("created_at", { ascending: false })` إلى `.order("display_order", { ascending: true }).order("created_at", { ascending: false })` — بحيث الخدمات ذات الترتيب الأصغر تظهر أولاً، وعند التساوي يُستخدم تاريخ الإنشاء.

نفس التغيير يُطبق على `src/pages/Marketplace.tsx` إن وُجد استعلام مشابه.

## 4. واجهة ترتيب الخدمات في لوحة الإدارة

**ملف:** `src/pages/admin/AdminServices.tsx`

إضافة عمود "الترتيب" في جدول الخدمات مع حقل `Input` رقمي لكل خدمة يتيح للأدمن تغيير قيمة `display_order`. عند التغيير يتم تحديث القيمة مباشرة في قاعدة البيانات.

### ملخص التغييرات:
| الملف | التغيير |
|---|---|
| `Index.tsx` | تبديل ترتيب قسمي الطلبات والخدمات |
| Migration | إضافة عمود `display_order` |
| `useLandingStats.ts` | ترتيب حسب `display_order` أولاً |
| `AdminServices.tsx` | حقل رقمي لتعديل ترتيب كل خدمة |

