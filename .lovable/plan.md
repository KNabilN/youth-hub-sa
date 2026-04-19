
## المشكلة
في صفحة `/marketplace`، الترتيب (sortBy) يتم على مستوى **الصفحة الحالية فقط** لأن:
- `price_asc` / `price_desc` / `rating` يطبَّق في `useMemo` على نتيجة الـ query بعد تطبيق `.range(from, to)` (أي بعد الـ pagination)
- الترتيب الفعلي في الـ query ثابت دائماً: `display_order` ثم `created_at`
- `rating` يُحسب client-side من `ratingsMap` لكن فقط على 20 صف ظاهر

النتيجة: تغيير "الأعلى سعراً" يرتب 20 خدمة فقط من أصل 4 صفحات بدلاً من ترتيب الـ 80 خدمة كلها واختيار الأعلى.

## الحل

### `src/pages/Marketplace.tsx`
نقل الترتيب إلى **جانب الخادم (server-side)** ضمن استعلام Supabase قبل الـ `.range()`:

1. **`newest`** → `.order("created_at", { ascending: false })` (مع إبقاء `display_order` كأولوية أولى أو إزالته حسب الترتيب المختار)
2. **`price_asc`** → `.order("price", { ascending: true })`
3. **`price_desc`** → `.order("price", { ascending: false })`
4. **`rating`** → يحتاج معالجة خاصة:
   - إما إضافة عمود محسوب `avg_rating` على جدول `micro_services` (الأمثل للأداء عبر trigger يحدّثه عند إضافة تقييم)
   - أو إنشاء **Database View / RPC** يرجّع الخدمات مرتبة حسب متوسط تقييم المزود
   - **الخيار المقترح**: إنشاء RPC function `get_marketplace_services` تقبل الفلاتر + الترتيب + الـ pagination، وتُرجع الخدمات مع متوسط التقييم محسوباً، مع ORDER BY على المستوى الكامل قبل LIMIT/OFFSET

### الخطوات
1. **Migration**: إنشاء RPC function `public.get_marketplace_services(...)` تقبل: `p_category, p_region, p_city, p_service_type, p_search, p_price_min, p_price_max, p_sort, p_offset, p_limit` وتُرجع الخدمات مع `avg_rating` وعمود `total_count` (للـ pagination) — كلها مرتبة على كامل البيانات.
2. **`Marketplace.tsx`**: استبدال الـ query المباشر بـ `supabase.rpc("get_marketplace_services", {...})`.
3. **إزالة `useMemo` للترتيب** — لم يعد ضرورياً.
4. **إزالة `ratingsMap` query** — التقييم سيأتي ضمن RPC.
5. **إبقاء `useQuery` للعدد الكلي** أو دمجه مع RPC (window function `count(*) over()`).

### ملاحظة على باقي الصفحات
هذه المشكلة قد تتكرر في صفحات أخرى تستخدم pagination + sort client-side (مثل `AvailableProjects`, `MyServices`, إلخ). نقترح فحصها لاحقاً عند الحاجة، لكن هذا الـ plan يركّز على `Marketplace` فقط حسب طلبك المحدد.

### النتيجة
- الترتيب يطبّق على كامل الـ 80+ خدمة قبل تقسيمها لصفحات
- الأداء يتحسن (لا حاجة لجلب جميع التقييمات client-side)
- الفلاتر (موجودة أصلاً server-side) تستمر بالعمل بنفس الطريقة الصحيحة
