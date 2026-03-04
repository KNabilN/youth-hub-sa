

# Allow Logged-in Users to Visit the Landing Page

## Problem
Currently there's no way for a logged-in user to navigate back to the public landing page from the dashboard. The routing already supports it (public routes have no `ProtectedRoute` wrapper), but there's no navigation link.

## Changes

### 1. `src/components/landing/LandingHeader.tsx`
- Check auth state using `useAuth()`
- If user is logged in: show "لوحة التحكم" (Dashboard) button instead of login/register buttons
- Keep the navigation links (الرئيسية, من نحن, etc.) visible regardless of auth state

### 2. `src/components/AppSidebar.tsx`
- Add a "الصفحة الرئيسية" link (with a Home icon) at the top of or near the sidebar menu that links to `/` so users can return to the landing page from the dashboard

### Result
- Logged-in users see a "Dashboard" button in the landing header instead of login/register
- Sidebar includes a link back to the landing page
- No sign-out required to browse public pages

