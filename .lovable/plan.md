# إصلاح فقدان تركيز حقل البحث في إدارة المستخدمين

## التشخيص

في `src/components/admin/UserTable.tsx` السطر 165:

```tsx
if (isLoading) return ( <Skeleton ... /> );
```

عند كل ضغطة مفتاح في حقل البحث:
1. تتغير قيمة `search` → يتغير `queryKey` لـ `useAdminUsers`.
2. React Query تُعيد التحميل و `isLoading` تصبح `true` للحظة.
3. المكوّن يرجع شجرة JSX مختلفة كلياً (Skeleton)، فتُزال شريط الفلاتر و حقل الـ Input من الـ DOM.
4. عند انتهاء التحميل يُعاد رسم الشجرة الأصلية ولكن الـ Input هو **عنصر جديد**، لذا يفقد التركيز.

بالإضافة إلى ذلك، الإرسال على كل ضغطة مفتاح يُولّد طلبات شبكة كثيرة بلا داعٍ.

## الخطة

### 1. عزل الـ Skeleton داخل الجدول بدلاً من استبدال الشجرة كاملة
- إزالة `if (isLoading) return ...` المبكِّر.
- إبقاء شريط الفلاتر (بما فيه `Input` البحث) مرسوماً دائماً.
- عرض صفوف Skeleton فقط داخل `<TableBody>` عندما `isLoading` صحيح، أو الصفوف الفعلية عندما تتوفر البيانات.

### 2. الاحتفاظ بالبيانات السابقة أثناء إعادة التحميل
- في `src/hooks/useAdminUsers.ts` تمرير `placeholderData: keepPreviousData` (من `@tanstack/react-query`) إلى كل من `useAdminUsers` و `useAdminUsersCount`.
- النتيجة: عند تغيير الفلتر، `isLoading` تبقى `false` (لأن هناك بيانات سابقة)، ولا يحدث وميض ولا تُمسح الصفوف.

### 3. إضافة تأخير (debounce) لقيمة البحث
- في `UserTable.tsx` إضافة `useEffect` يحدِّث `debouncedSearch` بعد 300 مللي ثانية من آخر تعديل.
- استخدام `debouncedSearch` فقط داخل الـ `filters` المُمرَّرة للـ hooks، بينما يبقى `search` مرتبطاً بقيمة الـ Input فوراً (تجربة كتابة سلسة).

### 4. تثبيت مرجع الـ filters (تحسين)
- تغليف كائن `filters` بـ `useMemo` مع الاعتماد على القيم الفعلية فقط، لتجنّب أي إعادة حساب غير ضرورية.

## النتيجة المتوقعة

- الحقل يحتفظ بالتركيز أثناء الكتابة المستمرة.
- لا يحدث "وميض" أو استبدال للجدول مع كل حرف.
- عدد طلبات الشبكة ينخفض من واحد لكل حرف إلى واحد كل 300 مللي ثانية بعد التوقف.

## الملفات المتأثرة

- `src/components/admin/UserTable.tsx` — debounce للبحث + إزالة الـ early return + Skeleton داخل الجدول.
- `src/hooks/useAdminUsers.ts` — إضافة `placeholderData: keepPreviousData` للاستعلامين.
