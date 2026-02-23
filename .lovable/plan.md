

# Next Steps: Bug Fixes and Polish

All 9 planned feature batches have been implemented. The next step focuses on fixing runtime warnings, improving quality, and adding missing polish.

---

## 1. Fix React Ref Warnings

The console shows "Function components cannot be given refs" warnings for `DashboardLayout` and `Badge`. These are caused by components receiving refs without using `React.forwardRef`.

- **`src/components/DashboardLayout.tsx`** -- Wrap with `React.forwardRef` so parent `SidebarTrigger` can pass refs.
- **`src/components/ui/badge.tsx`** -- Wrap `Badge` with `React.forwardRef` (standard shadcn pattern).

---

## 2. Dark Mode: Add `.dark` class support to `<html>` tag

Currently `index.html` has `<html lang="ar" dir="rtl">` but no `class` attribute. The `next-themes` `ThemeProvider` with `attribute="class"` will dynamically add/remove the `dark` class at runtime, so this should work. However, to avoid a flash of unstyled content on dark-mode-preferring systems, we should add `suppressHydrationWarning` considerations (not needed for Vite SPA -- this is fine as-is).

No change needed here -- already working correctly.

---

## 3. Improve `useMyServices` to pass `image_url`

The `useCreateService` and `useUpdateService` mutations accept `TablesInsert`/`TablesUpdate` which now include `image_url` from the schema. The `ServiceForm` already passes `image_url` in `onSubmit`. Verify the calling pages (`MyServices.tsx`) pass it through correctly.

- **`src/pages/MyServices.tsx`** -- Verify that `onSubmit` handler passes `image_url` to the create/update mutations.

---

## 4. Landing Page Enhancements

The landing page (`Index.tsx`) is functional but could benefit from:

- **Footer** with links (About, Terms, Privacy, Contact)
- **Testimonials** section with placeholder data
- **Partner logos** section

---

## 5. Loading States and Error Boundaries

Add a global error boundary to catch React rendering errors gracefully:

- **Create `src/components/ErrorBoundary.tsx`** -- A class component that catches errors and shows a friendly Arabic error message with a "Retry" button.
- **`src/App.tsx`** -- Wrap routes with the error boundary.

---

## 6. Profile Page Improvements

The user is currently on `/profile`. Minor improvements:

- **Email display** -- Show the user's email (read-only) in the profile card for reference.
- **Account creation date** -- Show when the account was created.

---

## Technical Summary

| Item | Files Modified/Created |
|------|----------------------|
| Fix ref warnings | DashboardLayout.tsx, badge.tsx |
| Verify image_url flow | MyServices.tsx |
| Landing page footer | Index.tsx |
| Error boundary | ErrorBoundary.tsx (new), App.tsx |
| Profile polish | Profile.tsx |

**Estimated: 1 new file, 5 files modified. No database changes.**

