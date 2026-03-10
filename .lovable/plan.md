

# تحسين أداء النظام وسرعة التنقل بين الصفحات

## المشاكل المكتشفة

### 1. أخطاء تحميل الوحدات الديناميكية (Dynamic Import Errors)
`recharts`، `@radix-ui/react-select`، `@radix-ui/react-tabs` تفشل في التحميل أحياناً بسبب عدم وجود إعدادات `resolve.dedupe` و `optimizeDeps` في Vite. هذا يسبب بطء وتعطل في التنقل.

### 2. تحذير forwardRef في AdminNotifications
مكون `Select` يتلقى ref بشكل خاطئ — لا يؤثر على الوظيفة لكنه يضيف عبء على DevTools.

### 3. استعلامات مكررة عند كل تنقل
`ProtectedRoute` يستدعي `useProfile()` و `DashboardLayout` يستدعيه مرة ثانية + `useNotifications` + `useUnreadCount` + `useProfileCompleteness` (الذي يستدعي `useProfile` مرة ثالثة). هذا يعني 3 استدعاءات لنفس البيانات عند كل صفحة.

## التغييرات المطلوبة

### 1. تحسين Vite Config (`vite.config.ts`)
إضافة `resolve.dedupe` لمنع تكرار مكتبات React و `optimizeDeps.include` لتسريع التحميل الأولي:
```typescript
resolve: {
  dedupe: ["react", "react-dom", "react/jsx-runtime"],
  // ...alias
},
optimizeDeps: {
  include: [
    "@tanstack/react-query",
    "recharts",
    "@radix-ui/react-select",
    "@radix-ui/react-tabs",
    "react-router-dom",
  ],
},
```

### 2. إصلاح ProtectedRoute — إزالة useProfile المكرر
`ProtectedRoute` يستدعي `useProfile` فقط للتحقق من `is_suspended`. يمكن نقل هذا التحقق داخل `DashboardLayout` الذي يستدعي `useProfile` بالفعل، وإزالته من `ProtectedRoute` لتقليل الاستعلامات المكررة.

**ملف: `src/components/ProtectedRoute.tsx`**
- إزالة `useProfile` واستبداله بالاعتماد على `useAuth` فقط
- نقل التحقق من `is_suspended` إلى `DashboardLayout`

**ملف: `src/components/DashboardLayout.tsx`**
- إضافة فحص `is_suspended` هنا (حيث `useProfile` موجود بالفعل)

### 3. تقليل إعادة التصيير في DashboardLayout
- تغليف مكونات الـ header (notifications popover, user avatar) بـ `React.memo` لمنع إعادة التصيير غير الضرورية

### الملفات المتأثرة
- `vite.config.ts`
- `src/components/ProtectedRoute.tsx`
- `src/components/DashboardLayout.tsx`

