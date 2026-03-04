

## خطة: إضافة رقم تعريفي فريد للمستخدمين

### التغييرات

#### 1. Migration
- إضافة عمود `user_number` (text, default '') لجدول `profiles`
- إنشاء trigger function `generate_user_number()` بنمط `USR-YYYYMMDD-NNNN`
- ربط الـ trigger بـ `BEFORE INSERT ON profiles`
- تعبئة الأرقام للمستخدمين الحاليين

#### 2. عرض الرقم في جدول المستخدمين (`UserTable.tsx`)
- إضافة عمود "الرقم" بجانب عمود "الاسم"
- عرضه بتنسيق `whitespace-nowrap` متوافق مع باقي الجداول

#### 3. عرض الرقم في صفحة تفاصيل المستخدم (`AdminUserDetail.tsx`)
- إضافة الرقم في قسم البيانات الأساسية

### الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| Migration | عمود + trigger + تعبئة البيانات الحالية |
| `UserTable.tsx` | عمود جديد "الرقم" |
| `AdminUserDetail.tsx` | عرض رقم المستخدم |

