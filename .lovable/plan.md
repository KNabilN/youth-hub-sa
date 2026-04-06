

# إصلاح بطء رفع صورة التصنيف

## المشكلة
رفع صورة 400KB يأخذ وقت طويل بسبب:
1. **`upsert: true`** يجبر Supabase على فحص وحذف الملف القديم قبل الرفع
2. لا يوجد معاينة فورية — المستخدم يرى فقط spinner بدون أي تغيير بصري
3. عدم تحديد `contentType` يجبر الخادم على تخمين النوع

## الحل — `src/components/admin/CategoryImageUpload.tsx`

### 1. معاينة فورية للصورة قبل اكتمال الرفع
إضافة `preview` state باستخدام `URL.createObjectURL(file)` لعرض الصورة فوراً عند اختيارها.

### 2. استخدام اسم ملف فريد بدلاً من upsert
بدلاً من `upsert: true` على نفس المسار (بطيء):
```typescript
// من:
const path = `${categoryId}/image.${ext}`;
await supabase.storage.from("category-images").upload(path, file, { upsert: true });

// إلى:
const path = `${categoryId}/${Date.now()}.${ext}`;
await supabase.storage.from("category-images").upload(path, file, {
  contentType: file.type,
  cacheControl: "3600",
});
```

### 3. تحديد `contentType` صريحاً
إضافة `contentType: file.type` لتجنب تخمين الخادم.

### 4. تنظيف المعاينة عند الإغلاق
`URL.revokeObjectURL` في cleanup.

| الملف | التغيير |
|-------|---------|
| `src/components/admin/CategoryImageUpload.tsx` | معاينة فورية + اسم فريد + contentType |

