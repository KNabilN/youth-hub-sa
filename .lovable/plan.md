

## خطة: إضافة بحث لحقل اختيار المانح في صفحة MyGrants

### التغيير

تحويل حقل "اختر المانح" (سطر 132-137) من `Select` عادي إلى **Combobox** قابل للبحث باستخدام `Popover` + `Command` (نفس النمط المستخدم في `DonationForm.tsx`).

### الملف المتأثر

| الملف | التغيير |
|-------|---------|
| `src/pages/MyGrants.tsx` | استبدال Select بـ Popover+Command combobox مع حالة `donorOpen` للتحكم بالفتح/الإغلاق |

### التفاصيل
- إضافة state `donorOpen` للتحكم بـ Popover
- استخدام `CommandInput` للبحث بالاسم
- عرض `CommandItem` لكل مانح مع علامة ✓ للمحدد
- عند الاختيار يتم تعيين `donorId` وإغلاق القائمة

