

## مراجعة شاملة للمنصة — النتائج والتوصيات

بعد مراجعة شاملة للكود والهيكل، المنصة بشكل عام مبنية بشكل جيد مع أنماط متسقة. لكن وجدت عدة مشاكل تحتاج إصلاح:

---

### 1. مشاكل قاعدة البيانات والاستعلامات (Database Issues)

#### 1.1 `useAvailableProject()` لا يفلتر `deleted_at`
**الملف:** `src/hooks/useAvailableProjects.ts` (سطر 41-55)

دالة `useAvailableProject(id)` تجلب مشروع بالـ ID بدون فلتر `deleted_at IS NULL`. مزود الخدمة يمكنه الوصول لمشروع محذوف عبر `/available-projects/:id`.

```typescript
// الحالي - ينقصه فلتر الحذف
.eq("id", id!)
.single();

// المطلوب
.eq("id", id!)
.is("deleted_at", null)
.single();
```

#### 1.2 `useConversations()` لا يفلتر المشاريع المحذوفة
**الملف:** `src/hooks/useMessages.ts` (سطر 129-133)

المحادثات تعرض مشاريع محذوفة لأن الاستعلام لا يتضمن `.is("deleted_at", null)`.

#### 1.3 `contract` query في `ProjectDetails.tsx` لا يفلتر `deleted_at`
**الملف:** `src/pages/ProjectDetails.tsx` (سطر 69-80)

العقد المرتبط بالمشروع يُجلب بدون فلتر الحذف الناعم.

#### 1.4 `useMyInvoices` لا يفلتر الفواتير المحذوفة
**الملف:** `src/hooks/useMyInvoices.ts`

لا يوجد `.is("deleted_at", null)` — فواتير محذوفة قد تظهر عند المستخدم.

---

### 2. مشاكل تدفق المستخدم (User Flow Issues)

#### 2.1 `useAcceptBid` لا ينشئ عقد تلقائياً
**الملف:** `src/hooks/useBids.ts` (سطر 34-55)

عند قبول عرض سعر، يتم تحديث حالة العرض وتعيين المزود لكن **لا يتم إنشاء عقد تلقائي**. المستخدم يحتاج إنشاء العقد يدوياً — هذا قد يكون مقصود لكنه يكسر تجربة المستخدم إذا كان العقد خطوة إلزامية.

#### 2.2 الضمان المالي يُستعلم بـ `payer_id = user.id` فقط
**الملف:** `src/pages/ProjectDetails.tsx` (سطر 110-124)

استعلام الضمان المالي مفلتر بـ `payer_id = user.id` — إذا كان المستخدم هو مزود الخدمة وليس الدافع، لن يرى الضمان. **هذا مقصود حسب التصميم** لكن المزود لا يرى حالة الضمان في صفحة تفاصيل الطلب.

---

### 3. مشاكل UI/UX

#### 3.1 عدم وجود Trash link في sidebar لغير الأدمن
الكود يعرض `/trash` فقط للأدمن (`AdminRoute`) لكن دالة `useTrash` تدعم المستخدمين العاديين. المستخدم العادي الذي حذف عنصراً لا يمكنه الوصول لسلة المحذوفات.

#### 3.2 Profile page يستخدم `(profile as any)` كثيراً
**الملف:** `src/pages/Profile.tsx`

أكثر من 15 استخدام لـ `(profile as any)` — يشير لعدم تطابق نوع البيانات مع الجدول. هذا لا يكسر الوظائف لكنه يخفي أخطاء محتملة.

---

### 4. خطة الإصلاح

| # | الملف | التعديل | الأولوية |
|---|---|---|---|
| 1 | `src/hooks/useAvailableProjects.ts` | إضافة `.is("deleted_at", null)` في `useAvailableProject()` | عالية |
| 2 | `src/hooks/useMessages.ts` | إضافة `.is("deleted_at", null)` في `useConversations()` | عالية |
| 3 | `src/pages/ProjectDetails.tsx` | إضافة `.is("deleted_at", null)` في contract query | متوسطة |
| 4 | `src/hooks/useMyInvoices.ts` | إضافة `.is("deleted_at", null)` | متوسطة |
| 5 | `src/pages/ProjectBidView.tsx` | تحسين رسالة "غير موجود" للمشاريع المحذوفة | متوسطة |

**ملاحظة:** بقية المنصة تبدو متسقة ومتصلة بشكل صحيح. الأنماط البصرية متوحدة (هيدرات، فواصل، أيقونات)، والـ RLS policies شاملة، والـ realtime subscriptions تعمل بشكل صحيح مع تنظيف مناسب.

