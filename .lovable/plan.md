

## المشكلة

الجمعيات حالياً تستطيع **إنشاء طلبات منح** فقط (صفحة `/my-grants`) لكن لا يوجد:
1. عرض **المنح المستلمة** (الأموال التي دفعها المانحون لصالحها)
2. إحصائيات في **لوحة التحكم** توضح إجمالي المنح المستلمة والرصيد المتبقي
3. إمكانية **استخدام رصيد المنح** لشراء خدمات أو دفع قيمة العروض
4. صفحة **تقارير الأثر** من جانب الجمعية (حالياً فقط المانح يراها)

---

## الحل

### 1. هوك جديد: `useAssociationGrants`
ملف جديد `src/hooks/useAssociationGrants.ts`:
- **`useReceivedGrants`**: جلب المنح المستلمة من `donor_contributions` حيث `association_id = user.id`
- **`useAssociationGrantBalance`**: حساب الرصيد المتاح = مجموع المنح المستلمة (available) - مجموع المبالغ المستخدمة من escrow
- **`useAssociationGrantStats`**: إحصائيات (إجمالي المنح، عدد المانحين، الرصيد المتبقي)

### 2. تحديث لوحة تحكم الجمعية — `Dashboard.tsx`
إضافة إحصائيتين جديدتين لـ `AssociationDashboard`:
- **إجمالي المنح المستلمة** (من `donor_contributions`)
- **رصيد المنح المتبقي** (متاح - مستخدم)

تغيير الشبكة من 5 أعمدة إلى تتناسب مع العدد الجديد.

### 3. تبويب المنح المستلمة في القائمة الجانبية
إضافة عنصر **"المنح المستلمة"** (`/received-grants`) في `AppSidebar.tsx` تحت قسم `youth_association`.

### 4. صفحة جديدة: المنح المستلمة — `src/pages/ReceivedGrants.tsx`
- بطاقات رصيد (متاح، محجوز، مستهلك)
- جدول بالمنح الواردة مع اسم المانح والمبلغ والحالة والتاريخ
- Route جديد في `App.tsx`

### 5. إمكانية الدفع من رصيد المنح
تعديل **`BidPaymentDialog.tsx`** و **`Checkout.tsx`**:
- إضافة خيار دفع ثالث: **"الدفع من رصيد المنح"** (يظهر فقط للجمعيات التي لديها رصيد كافٍ)
- عند اختياره: خصم المبلغ من `donor_contributions` (تحويل الحالة من `available` لـ `consumed`) وإنشاء escrow مباشرة بحالة `held`
- هوك جديد `usePayFromGrants` يتعامل مع تحديث الأرصدة

### 6. تقارير الأثر من جانب الجمعية
- صفحة جديدة `src/pages/AssociationImpactReports.tsx` تتيح للجمعية **رفع تقارير أثر** وعرض التقارير السابقة
- هوك `useAssociationImpactReports` لجلب/إنشاء التقارير حيث `association_id = user.id`
- إضافة في القائمة الجانبية والـ Router
- نموذج رفع يتضمن: عنوان، وصف، اختيار المانح المستهدف، رفع ملف PDF

### الملفات الجديدة
- `src/hooks/useAssociationGrants.ts`
- `src/pages/ReceivedGrants.tsx`
- `src/hooks/usePayFromGrants.ts`
- `src/pages/AssociationImpactReports.tsx`
- `src/hooks/useAssociationImpactReports.ts`

### الملفات المعدلة
- `src/pages/Dashboard.tsx` — إضافة إحصائيات المنح
- `src/components/AppSidebar.tsx` — إضافة "المنح المستلمة" + "تقارير الأثر"
- `src/App.tsx` — Routes جديدة
- `src/components/bids/BidPaymentDialog.tsx` — خيار الدفع من المنح
- `src/pages/Checkout.tsx` — خيار الدفع من المنح

