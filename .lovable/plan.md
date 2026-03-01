
# استبدال "value" بـ "القيمة" في تلميحات الرسوم البيانية

## المشكلة
في صفحة التقارير، عند تمرير الماوس على الرسوم البيانية، يظهر النص "value" بالإنجليزية بدلاً من "القيمة" بالعربية.

## الحل
تعديل مكون `CustomChartTooltip` في ملف `src/pages/admin/AdminReports.tsx` لاستبدال "value" بـ "القيمة" عند عرض اسم السلسلة في التلميح.

### التعديل في `src/pages/admin/AdminReports.tsx`
- السطر 41: تغيير عرض `entry.name` بحيث إذا كانت القيمة "value" يتم استبدالها بـ "القيمة"

```tsx
// قبل
<span className="text-muted-foreground">{entry.name ?? entry.dataKey}:</span>

// بعد
<span className="text-muted-foreground">{(entry.name === "value" ? "القيمة" : entry.name) ?? entry.dataKey}:</span>
```

تعديل بسيط في سطر واحد فقط يحل المشكلة لجميع الرسوم البيانية التي تستخدم نفس مكون التلميح.
