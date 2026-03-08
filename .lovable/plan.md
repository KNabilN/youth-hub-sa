

## تطبيق نفس تعديلات جدول الخدمات على جدول طلبات الجمعيات

### التغييرات على `src/pages/admin/AdminProjects.tsx`:

1. **إضافة `useNavigate`** من `react-router-dom`
2. **الصف كامل قابل للنقر**: إضافة `onClick={() => navigate(`/admin/projects/${p.id}`)}` و `cursor-pointer hover:bg-muted/50` على `TableRow`
3. **اقتصاص العنوان**: إضافة `max-w-[120px] truncate` مع `title` attribute على خلية العنوان (سطر 185)
4. **اقتصاص اسم الجمعية**: إضافة `max-w-[100px] truncate` مع `title` على خلية الجمعية (سطر 186)
5. **`stopPropagation`** على العناصر التفاعلية: إظهار الاسم (Switch)، مميز (Switch)، تغيير الحالة (Select)، وأزرار الإجراءات

