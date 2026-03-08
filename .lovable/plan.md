

## إصلاح صفحة سلة المشتريات

### المشكلة
- للزائر غير المسجّل: الصفحة تظهر بدون Header و Footer — تبدو منفصلة عن الموقع
- للمستخدم المسجّل: التصميم يحتاج تحسين وتوحيد مع باقي الصفحات

### الحل

**1. App.tsx — نقل route السلة:**
- نقل `/cart` داخل `PublicLayout` للزوار غير المسجّلين حتى يظهر الهيدر والفوتر
- إضافة route محمي `/cart` داخل `ProtectedRoute` + `DashboardLayout` للمسجّلين
- بما أن السلة تعمل للحالتين، سنستخدم مكوّنين: واحد عام وواحد محمي، أو الأفضل: نبقي route واحد داخل `PublicLayout` ونتحكم بالعرض من داخل Cart

**2. Cart.tsx — تحسين التصميم:**
- للزائر: إزالة الـ Wrapper المخصص واستخدام `PublicLayout` (الهيدر والفوتر يأتون تلقائياً من الـ route)
- للمسجّل: استخدام `DashboardLayout` كما هو مع تحسين الـ header ليتطابق مع الهوية البصرية (gradient divider)
- توحيد ألوان الأيقونات والأزرار مع ثيم الموقع

### التغييرات

| الملف | التغيير |
|-------|---------|
| `App.tsx` | نقل `/cart` ليكون route مزدوج: داخل `PublicLayout` للزوار، و route منفصل بـ `DashboardLayout` للمسجّلين — أو الأسهل: إبقاؤه خارج PublicLayout مع التحكم من Cart.tsx |
| `Cart.tsx` | للزائر: لف المحتوى بـ `PublicLayout` components يدوياً (LandingHeader + LandingFooter) — أو نقل الـ route. للمسجّل: إبقاء `DashboardLayout` مع header موحّد |

### النهج المختار
الأبسط: نقل route `/cart` داخل `PublicLayout` group في App.tsx، وفي Cart.tsx نعرض `DashboardLayout` للمسجّل فقط (المحتوى الداخلي)، وللزائر نعرض المحتوى مباشرة (PublicLayout يوفر الهيدر والفوتر). هذا يتطلب تعديل Cart.tsx لعدم لف المحتوى بـ wrapper مخصص للزائر.

