

# إصلاح عدم تحديث صورة التصنيف في المشاريع والخدمات

## المشكلة
عند تغيير صورة التصنيف من إعدادات الأدمن، يتم تحديث بيانات التصنيف فقط (`admin-categories`, `categories`). لكن استعلامات المشاريع والخدمات التي تجلب صورة التصنيف عبر JOIN تبقى مُخزنة مؤقتاً (cached) في React Query ولا تُعاد.

## الحل — `src/components/admin/CategoryImageUpload.tsx`

إضافة invalidation لجميع query keys المتأثرة عند نجاح رفع أو حذف صورة التصنيف:

```typescript
// في onSuccess لكل من uploadMut و removeMut، إضافة:
qc.invalidateQueries({ queryKey: ["admin-services"] });
qc.invalidateQueries({ queryKey: ["admin-projects"] });
qc.invalidateQueries({ queryKey: ["marketplace"] });
qc.invalidateQueries({ queryKey: ["projects"] });
qc.invalidateQueries({ queryKey: ["landing-stats"] });
qc.invalidateQueries({ queryKey: ["service-detail"] });
qc.invalidateQueries({ queryKey: ["my-services"] });
qc.invalidateQueries({ queryKey: ["available-projects"] });
```

هذا يجبر جميع الصفحات التي تعرض صورة التصنيف كـ fallback على إعادة جلب البيانات الجديدة فوراً.

| الملف | التغيير |
|-------|---------|
| `src/components/admin/CategoryImageUpload.tsx` | إضافة invalidation لاستعلامات الخدمات والمشاريع |

