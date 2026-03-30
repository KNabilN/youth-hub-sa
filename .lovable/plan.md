
# ترتيب العناصر المعلقة/غير الموثقة في أعلى القائمة

## التغييرات

### 1. `src/pages/admin/AdminServices.tsx` — ترتيب "قيد المراجعة" أولاً
بعد الفلترة (سطر 91-99)، إضافة ترتيب يجعل الخدمات ذات حالة `pending` تظهر أولاً:
```typescript
const filtered = (services ?? []).filter(...)
  .sort((a, b) => {
    if (a.approval === "pending" && b.approval !== "pending") return -1;
    if (a.approval !== "pending" && b.approval === "pending") return 1;
    return 0;
  });
```

### 2. `src/hooks/useAdminUsers.ts` — ترتيب غير الموثقين أولاً
تعديل استعلام `useAdminUsers` لإضافة ترتيب `is_verified` تصاعدي (false أولاً) قبل ترتيب `created_at`:
```typescript
profilesQuery = profilesQuery
  .order("is_verified", { ascending: true })
  .order("created_at", { ascending: false });
```

### ملفات متأثرة

| الملف | التغيير |
|-------|---------|
| `src/pages/admin/AdminServices.tsx` | ترتيب pending أولاً بعد الفلترة |
| `src/hooks/useAdminUsers.ts` | ترتيب بـ `is_verified` تصاعدي قبل `created_at` |
