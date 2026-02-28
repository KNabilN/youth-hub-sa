

# Smooth Transitions and Loading UX Improvement

## Problem
Currently, when navigating between pages or switching tabs, users see jarring loading states:
1. **Full-page loading spinners** in `ProtectedRoute` and `AdminRoute` block the entire screen while auth checks
2. **Lazy-loaded pages** show a generic `PageLoader` skeleton that replaces the entire viewport, causing the sidebar to disappear and reappear
3. **Data loading states** on many admin pages show plain text ("جارٍ التحميل...") instead of skeleton placeholders that maintain layout structure
4. **No transition animations** between page content changes

## Solution

### 1. Move Suspense fallback inside DashboardLayout
Instead of wrapping all routes in a single `<Suspense>` that replaces everything (including the sidebar), move the fallback inside the layout so the sidebar stays visible during page transitions.

**File: `src/App.tsx`**
- Remove the outer `<Suspense>` wrapper around `<Routes>`
- Wrap each lazy-loaded route's component in its own `<Suspense>` with a lightweight inline skeleton (or create a shared wrapper)

### 2. Create a reusable content skeleton component
**New file: `src/components/ContentSkeleton.tsx`**
- A skeleton that mimics a typical page layout (title bar + grid/table placeholders)
- Used as fallback inside `DashboardLayout` pages instead of the full-page `PageLoader`

### 3. Replace plain text loading states with skeleton placeholders
Update the following pages to use `<Skeleton>` components instead of plain "جارٍ التحميل..." text:

- `src/components/admin/UserTable.tsx` - table skeleton rows
- `src/pages/admin/AdminProjects.tsx` - table skeleton rows
- `src/pages/admin/AdminServices.tsx` - table skeleton rows
- `src/pages/admin/AdminTickets.tsx` - table skeleton rows
- `src/pages/admin/AdminDisputes.tsx` - card skeletons
- `src/pages/admin/AdminFinance.tsx` - table skeleton rows (3 tabs)
- `src/pages/EditRequests.tsx` - card skeletons
- `src/pages/ProjectBidView.tsx` - content skeleton

### 4. Add CSS transition for page content
**File: `src/index.css`**
- Add a subtle fade-in animation class for main content area to smooth page transitions

### 5. Animate DashboardLayout main content
**File: `src/components/DashboardLayout.tsx`**
- Apply `animate-fade-in` class to `<main>` content wrapper so each page transition fades in smoothly

---

## Technical Details

### App.tsx Suspense restructuring
```text
Before:
  <Suspense fallback={<PageLoader />}>    <-- replaces entire viewport
    <Routes>...</Routes>
  </Suspense>

After:
  <Routes>
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Suspense fallback={<ContentSkeleton />}>  <-- only replaces content area
          <Dashboard />
        </Suspense>
      </ProtectedRoute>
    } />
    ...
  </Routes>
```

### Skeleton table pattern (applied to ~8 files)
Replace:
```tsx
{isLoading ? <p className="text-center py-8">جارٍ التحميل...</p> : (...)}
```
With:
```tsx
{isLoading ? (
  <div className="border rounded-lg p-4 space-y-3">
    {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
  </div>
) : (...)}
```

### ContentSkeleton component
A lightweight skeleton showing a title bar and 4 rows, designed to sit inside DashboardLayout without causing layout shift.

### Files to modify
1. `src/App.tsx` - Restructure Suspense boundaries
2. `src/components/DashboardLayout.tsx` - Add fade-in animation to main content
3. `src/components/ContentSkeleton.tsx` (new) - Reusable page skeleton
4. `src/components/admin/UserTable.tsx` - Skeleton loading
5. `src/pages/admin/AdminProjects.tsx` - Skeleton loading
6. `src/pages/admin/AdminServices.tsx` - Skeleton loading
7. `src/pages/admin/AdminTickets.tsx` - Skeleton loading
8. `src/pages/admin/AdminDisputes.tsx` - Skeleton loading
9. `src/pages/admin/AdminFinance.tsx` - Skeleton loading (3 sections)
10. `src/pages/EditRequests.tsx` - Skeleton loading
11. `src/pages/ProjectBidView.tsx` - Skeleton loading

