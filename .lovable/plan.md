

# تخصيص عرض العنوان في سطرين + تحديد عدد الحروف

## التغييرات

### 1. تعديل `ServiceCard.tsx` و `LandingServicesGrid.tsx`
- تغيير `truncate` (سطر واحد) إلى `line-clamp-2` (سطرين) على عنوان الخدمة في البطاقات

### 2. تعديل `ServiceForm.tsx` — validation العنوان
- تغيير `.max(200)` إلى `.max(80)` مع رسالة خطأ عربية: "العنوان يجب ألا يتجاوز 80 حرفاً"
- إضافة `CharCounter` تحت حقل العنوان لإظهار عدد الحروف المتبقية (المكون موجود بالفعل)

80 حرف كافية لملء سطرين في عرض البطاقة الحالي دون اقتصاص.

### ملفات متأثرة
| الملف | التغيير |
|-------|---------|
| `src/components/marketplace/ServiceCard.tsx` | `truncate` → `line-clamp-2` |
| `src/components/landing/LandingServicesGrid.tsx` | `truncate` → `line-clamp-2` |
| `src/components/services/ServiceForm.tsx` | max 80 + CharCounter |

