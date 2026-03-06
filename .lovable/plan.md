

## المشكلة

في صفحة `ProjectDetails.tsx`، استعلام الضمان المالي يستخدم `.maybeSingle()` لجلب الضمان:

```typescript
const { data: escrow } = useQuery({
  queryFn: async () => {
    const { data } = await supabase
      .from("escrow_transactions")
      .select("*")
      .eq("project_id", id!)
      .maybeSingle();  // ← يفشل إذا وُجد أكثر من سجل
    return data;
  },
});
```

**السبب الجذري**: يوجد سجلان ضمان لنفس المشروع:
1. ضمان دفع الجمعية لمزود الخدمة (payer = الجمعية، payee = المزود) — وهو الصحيح
2. ضمان منحة المانح للجمعية (payer = المانح، payee = الجمعية) — هذا ضمان تبرع

الجمعية ترى كلاهما بموجب سياسة RLS (كـ payer في الأول و payee في الثاني)، فيفشل `.maybeSingle()` ويرجع `null` ← "لا يوجد ضمان مالي محتجز".

## الحل

### تعديل `src/pages/ProjectDetails.tsx`

تغيير استعلام الضمان ليجلب فقط الضمان الذي أنشأته الجمعية (حيث `payer_id = user.id`):

```typescript
const { data: escrow } = useQuery({
  queryKey: ["project-escrow", id],
  enabled: !!id && !!user,
  queryFn: async () => {
    const { data } = await supabase
      .from("escrow_transactions")
      .select("*")
      .eq("project_id", id!)
      .eq("payer_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },
});
```

هذا يضمن جلب ضمان الدفع الخاص بالمشروع فقط، وليس ضمانات المنح الواردة.

### تعديل `src/hooks/useEscrow.ts` (نفس المشكلة في `useReleaseEscrow`)

`useReleaseEscrow` أيضاً يستخدم `.maybeSingle()` بدون فلترة كافية:
```typescript
.eq("project_id", projectId)
.eq("status", "held")
.maybeSingle();
```

يجب إضافة ترتيب وحد أو فلترة أدق لتجنب نفس المشكلة عند وجود ضمانين بحالة `held`.

### الملفات المتأثرة

| الملف | التعديل |
|---|---|
| `src/pages/ProjectDetails.tsx` | إضافة `.eq("payer_id", user.id)` لاستعلام الضمان |
| `src/hooks/useEscrow.ts` | تحسين استعلام `useReleaseEscrow` لتجنب تعدد النتائج |

