## المشكلة
في رأس الصفحة (أعلى يسار) يظهر اسم مختلف عن اسم مزود الخدمة الفعلي. السبب أن `HeaderUserInfo` في `DashboardLayout.tsx` يعرض `organization_name` قبل `full_name` لكل المستخدمين، بينما حقل `organization_name` مخصّص فقط للجمعيات والممولين، ولمزوّد الخدمة قد يحتوي على قيمة قديمة (مثل "الرياض") فيظهر بدلاً من الاسم الصحيح.

كذلك `AppSidebar` يعرض `full_name` فقط، فإذا كان المستخدم جمعية يظهر اسم الشخص بدل اسم المنظمة، وهي حالة غير متّسقة.

## الحل
توحيد طريقة عرض الاسم في كل مكان عبر الدالة الموجودة `getDisplayName(profile, role)` الموجودة في `src/lib/utils.ts`، والتي تختار:
- اسم المنظمة للجمعيات.
- الاسم الكامل لمزوّدي الخدمة والممولين والمشرفين.

## الملفات المتأثرة
1. **`src/components/DashboardLayout.tsx`** (`HeaderUserInfo`)
   - استخدام `useAuth().role` و `getDisplayName(profile, role)` بدل `profile?.organization_name || profile?.full_name`.
   - تحديث alt الصورة وحرف الـ fallback ليعتمد على الاسم الناتج من `getDisplayName`.

2. **`src/components/AppSidebar.tsx`** (السطور 300 و 306)
   - استخدام `getDisplayName(profile, role)` بدل `profile?.full_name` المباشر، حتى تظهر الجمعيات باسم المنظمة بشكل صحيح.

## ملاحظات
- لا تغييرات على البيانات أو RLS؛ تعديل عرض فقط.
- `useUpdateProfile` يقوم أصلاً بإبطال كاش `profile`، لذا التحديث سيظهر فور حفظ التعديلات.