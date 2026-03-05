

## خطة: مراجعة وإصلاح التوافق مع الجوال لكل شاشات الموقع

### المشاكل المكتشفة

بعد مراجعة شاملة للكود، معظم الشاشات مبنية بشكل جيد مع Tailwind responsive classes. لكن هناك عدة مشاكل:

#### 1. `AdminFinance.tsx` - تبويبات مالية مزدحمة على الجوال
- `TabsList` تحتوي 4 تبويبات بنصوص طويلة + badges بدون تمرير أفقي
- الجداول داخل التبويبات عريضة جداً (7+ أعمدة) بدون `overflow-x-auto` على بعضها
- أزرار الإجراءات في خلايا الجدول تتراكم

#### 2. `UserTable.tsx` - فلاتر وجدول إدارة المستخدمين
- شريط الفلاتر يحتوي 7+ عناصر `w-48`/`w-40` ثابتة → تتجاوز عرض الشاشة
- الجدول يحتوي 7 أعمدة بدون `overflow-x-auto`
- أزرار الإجراءات (3 أزرار) تتراكم في الخلية

#### 3. `ProjectDetails.tsx` - تبويبات تفاصيل الطلب
- `TabsList` تحتوي 6-7 تبويبات بدون `overflow-x-auto` أو `flex-nowrap`
- الأزرار العلوية (إرسال/إتمام/إلغاء/شكوى) تحتاج ترتيب أفضل

#### 4. `Earnings.tsx` - رأس الصفحة
- `flex items-center justify-between` مع زر "طلب سحب" → يتداخل مع العنوان على الشاشات الصغيرة

#### 5. `PublicProfile.tsx` - تبويبات البروفايل
- `TabsList` تحتوي `overflow-x-auto flex-nowrap` ✓ لكن بدون `scrollbar-hide` → يظهر scrollbar قبيح

#### 6. `DonorBalanceCards.tsx` - بطاقات الأرصدة
- `grid-cols-2 sm:grid-cols-5` → العنصر الخامس يظهر وحيداً بعرض كامل على الجوال (cols-2 مع 5 عناصر)

#### 7. `AdminFinance.tsx` - قسم الفلاتر
- `justify-end` يضغط العناصر لليسار → على الجوال تحتاج `justify-start` أو تغليف أفضل

#### 8. `Messages.tsx` - صفحة الرسائل
- `grid-cols-[320px_1fr]` → العرض الثابت 320px قد يكون كبيراً على بعض الأجهزة اللوحية

### التغييرات المطلوبة

| الملف | التعديل |
|-------|---------|
| `src/pages/admin/AdminFinance.tsx` | إضافة `overflow-x-auto flex-nowrap scrollbar-hide` للتبويبات |
| `src/components/admin/UserTable.tsx` | تصغير عرض الفلاتر على الجوال + إضافة `overflow-x-auto` للجدول |
| `src/pages/ProjectDetails.tsx` | إضافة `overflow-x-auto flex-nowrap scrollbar-hide` للتبويبات |
| `src/pages/Earnings.tsx` | تحويل الرأس إلى `flex-wrap` مع ترتيب أفضل |
| `src/pages/PublicProfile.tsx` | إضافة `scrollbar-hide` لشريط التبويبات |
| `src/components/donor/DonorBalanceCards.tsx` | تغيير إلى `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` |
| `src/pages/Messages.tsx` | تغيير `320px` إلى `min(320px, 40vw)` أو responsive class |

