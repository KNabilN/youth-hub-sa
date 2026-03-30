

# إعادة ترتيب تلقائي عند إزالة رقم ترتيب خدمة

## المشكلة
عند إزالة رقم ترتيب خدمة (مثلاً 3)، الخدمات التي بعدها (4، 5، ...) تبقى كما هي. المطلوب أن تتحرك تلقائياً لملء الفراغ.

## الحل
تعديل منطق `onBlur` في `AdminServices.tsx` ليقوم بعد تحديث الترتيب بإعادة ترقيم جميع الخدمات التي لها ترتيب فعلي (غير 999) بشكل متسلسل.

## التغييرات في `src/pages/admin/AdminServices.tsx`

### إضافة دالة `reorderServices`
بعد تحديث ترتيب خدمة واحدة، تُعاد قراءة جميع الخدمات المرتبة (display_order < 999)، ثم تُرقّم من 1 تصاعدياً بحسب ترتيبها الحالي:

```typescript
async function reorderServices() {
  const { data } = await supabase
    .from("micro_services")
    .select("id, display_order")
    .is("deleted_at", null)
    .lt("display_order", 999)
    .order("display_order", { ascending: true });
  if (!data?.length) return;
  for (let i = 0; i < data.length; i++) {
    if (data[i].display_order !== i + 1) {
      await supabase.from("micro_services").update({ display_order: i + 1 }).eq("id", data[i].id);
    }
  }
}
```

### تعديل `onBlur` handler (سطر 211-219)
بعد `updateService.mutate` الناجح، يُستدعى `reorderServices()` ثم يُعاد تحميل القائمة:

```typescript
onSuccess: async () => {
  await reorderServices();
  qc.invalidateQueries({ queryKey: ["admin-services"] });
  toast.success("تم تحديث الترتيب");
}
```

### ملف متأثر واحد

| الملف | التغيير |
|-------|---------|
| `src/pages/admin/AdminServices.tsx` | إضافة `reorderServices` + تعديل onBlur handler |

