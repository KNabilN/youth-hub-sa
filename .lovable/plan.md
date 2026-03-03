

## Comprehensive Security Audit & Fix Plan

### Findings Summary

| # | Severity | Finding | OWASP Category |
|---|----------|---------|----------------|
| 1 | **CRITICAL** | Public profiles expose phone numbers, emails, license numbers to unauthenticated users | A01 - Broken Access Control |
| 2 | **HIGH** | Public projects expose budget data to competitors | A01 - Broken Access Control |
| 3 | **HIGH** | Leaked password protection disabled | A07 - Identification & Auth Failures |
| 4 | **HIGH** | Edge functions return raw `error.message` in 500 responses, leaking internals | A09 - Security Logging & Monitoring |
| 5 | **MEDIUM** | `profile_saves` exposes user behavior publicly (who saved whom) | A01 - Broken Access Control |
| 6 | **MEDIUM** | Contact form has no rate-limiting or bot protection | A07 - Identification & Auth Failures |
| 7 | **MEDIUM** | Permissive RLS policy `USING(true)` / `WITH CHECK(true)` on INSERT for `contact_messages` | A01 - Broken Access Control |
| 8 | **LOW** | `console.error(err)` in client code could log sensitive stack traces | A09 - Security Logging & Monitoring |
| 9 | **INFO** | `dangerouslySetInnerHTML` used only in chart.tsx (safe — generated CSS, not user input) | N/A — No fix needed |

### What's Already Good

- Authentication uses Supabase Auth with proper session management (`onAuthStateChange` + `getSession`)
- Roles stored in separate `user_roles` table with `SECURITY DEFINER` helper `has_role()`
- Input validation with Zod on auth forms and contact form
- File uploads validate size (10MB) and MIME type whitelist
- Edge functions verify JWT via `getClaims()` with `verify_jwt = false`
- RLS policies are comprehensive across all tables
- Error boundary shows generic Arabic error, not stack traces
- Password reset flow correctly uses `resetPasswordForEmail` with redirect
- PDPL consent tracking on registration

---

### Fixes to Implement

#### 1. Restrict Public Profile Data (CRITICAL)

**Database migration**: Update the "Public browse approved service providers" RLS policy on `profiles` to only expose non-sensitive columns. Since RLS can't restrict columns, create a **public view** `public_profiles_view` that excludes sensitive fields (phone, contact_officer_phone, contact_officer_email, license_number, bank fields, notification_preferences), and update the public-facing queries to use it. Alternatively, restrict the existing public SELECT policy to only return rows for providers with approved services (already done) but also create a `SECURITY DEFINER` function that returns only safe fields for public access.

**Approach**: Create a DB function `get_public_profile(p_id uuid)` that returns only `id, full_name, avatar_url, bio, cover_image_url, organization_name, hourly_rate, skills, is_verified, profile_views` — no phone, email, bank, or contact officer data. Update `usePublicProfile.ts` to call this function instead of querying the profiles table directly.

#### 2. Restrict Public Project Data (HIGH)

**Database migration**: Update the "Public browse non-draft projects" policy to exclude budget information. Create a `get_public_project(p_id uuid)` function that returns only `id, title, description, category_id, region_id, city_id, required_skills, status, created_at` — no `budget`, `estimated_hours`, or `association_id`. Update the public project view page to use this function.

#### 3. Enable Leaked Password Protection (HIGH)

Use the auth configuration tool to enable leaked password protection (HaveIBeenPwned check on signup/password change).

#### 4. Sanitize Edge Function Error Responses (HIGH)

**`supabase/functions/send-email/index.ts`**: Replace `error.message` in the 500 catch block with a generic message. Log the actual error server-side only.

**`supabase/functions/bulk-create-associations/index.ts`**: Same — replace `err.message` in the final catch with generic error.

#### 5. Restrict profile_saves Public Access (MEDIUM)

**Database migration**: Change "Public count saves" policy on `profile_saves` from `USING (true)` to `USING (auth.uid() IS NOT NULL)` so only authenticated users can see save counts.

#### 6. Add Client-Side Rate Limiting for Contact Form (MEDIUM)

Add a simple debounce/cooldown in `ContactForm.tsx` — disable the submit button for 30 seconds after a successful submission and track submissions in session storage to prevent rapid re-submissions.

#### 7. Remove Sensitive Data from Console Logs (LOW)

In `ProjectDetails.tsx`, replace `console.error(err)` with `console.error("Project operation failed")` without logging the full error object that may contain query details.

---

### Files to Create/Modify

| File | Change |
|------|--------|
| DB migration | Create `get_public_profile()` function, update `profile_saves` RLS, restrict public project policy |
| `supabase/functions/send-email/index.ts` | Sanitize 500 error response |
| `supabase/functions/bulk-create-associations/index.ts` | Sanitize 500 error response |
| `src/hooks/usePublicProfile.ts` | Use `get_public_profile()` RPC instead of direct table query |
| `src/pages/ProjectPublicView.tsx` | Remove budget/hours from public view |
| `src/components/landing/ContactForm.tsx` | Add submission cooldown |
| `src/pages/ProjectDetails.tsx` | Sanitize console.error calls |
| Auth config | Enable leaked password protection |

