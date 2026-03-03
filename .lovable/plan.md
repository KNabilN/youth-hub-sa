

# Full Website Review Report

## Overview
After a thorough review of the codebase, the application is well-structured with consistent patterns. Below are the issues found, categorized by severity.

---

## 1. Database Connection Issues

### 1.1 Missing `deleted_at` filter in Marketplace query
**File:** `src/pages/Marketplace.tsx` (line 44)
The marketplace query fetches approved services but does NOT filter out soft-deleted ones (`.is("deleted_at", null)`). A provider who deletes a service will still see it appear in the marketplace until hard-purged.

### 1.2 Conversations fetching all messages without limit
**File:** `src/hooks/useMessages.ts` (line 135-139)
`useConversations` fetches ALL messages for ALL projects to compute unread count and last message. For users with many projects and messages, this will hit the 1000-row Supabase limit and cause missing data. Should use a server-side approach or at minimum add `.limit()` per project.

### 1.3 Ratings query missing join constraint
**File:** `src/pages/Marketplace.tsx` (lines 62-66)
`ratings` query joins `contracts(provider_id)` but `contracts` table has no `contract_id` FK on ratings. The join uses `contract_id` column which exists, but the query fetches ALL ratings globally without limit, which will become slow over time.

### 1.4 `useMyDisputes` fetches all disputes then filters client-side
**File:** `src/hooks/useMyDisputes.ts`
The query fetches ALL disputes from the database (relying on RLS for partial filtering), then applies a client-side `.filter()`. This is inefficient and won't scale. Should use `.or()` filter at the database level.

---

## 2. Functional Issues

### 2.1 Project completion allows bypass if deliverable was accepted on an older version
**File:** `src/pages/ProjectDetails.tsx` (line 135)
The `handleComplete` function checks `deliverable.status !== "accepted"` using `useDeliverable` which returns the LATEST deliverable. If the latest deliverable is `revision_requested` but an earlier one was `accepted`, completion will be blocked. Conversely, if the latest is accepted but it's an old version, there's no issue. However, the logic should check if ANY deliverable has been accepted, not just the latest.

### 2.2 `AssociationProfile.tsx` and `ProviderProfile.tsx` are unused orphan pages
These pages exist in `src/pages/` but have no routes defined in `App.tsx`. Dead code.

### 2.3 Missing `signOut` redirect
**File:** `src/hooks/useAuth.tsx` (line 71)
After `signOut`, the role state is cleared but there's no navigation redirect. The user stays on the current protected page until `ProtectedRoute` redirects, which may cause a brief flash of protected content or loading spinner.

### 2.4 Escrow double-creation possibility in `useSignContract`
**File:** `src/hooks/useContracts.ts` (lines 69-95)
When both parties sign, the code creates an escrow. But `useCreateEscrow` in `ProjectDetails.tsx` also allows manual escrow creation. The `useSignContract` hook checks for existing escrow before inserting, but there's a race condition if both sign simultaneously.

---

## 3. UI/UX Consistency Issues

### 3.1 Inconsistent toast usage
Some pages use `import { toast } from "sonner"` (e.g., `Earnings.tsx`, `Donations.tsx`) while others use `import { useToast } from "@/hooks/use-toast"` (e.g., `Contracts.tsx`, `Trash.tsx`). Both toast systems are rendered (`<Toaster />` and `<Sonner />`), but using two different systems creates inconsistent toast positioning and styling.

### 3.2 `forgot-password` link uses anchor tag instead of React Router
**File:** `src/components/AuthModal.tsx` (line 258)
Uses `<a href="/forgot-password">` instead of `<Link to="/forgot-password">`, causing a full page reload instead of client-side navigation.

### 3.3 Marketplace missing `is_deleted` filter in soft-deleted services
Already noted above, but also a UX issue: users see services that providers intended to remove.

---

## 4. Performance Concerns

### 4.1 Conversations query is N+1 pattern
`useConversations` makes 3 separate queries (projects, all messages, profiles). The messages query can return up to 1000 rows globally. Consider using an RPC function or at least limiting messages to the latest per project.

---

## Recommended Implementation Plan

### Priority 1 (Bugs/Data Issues)
1. **Add `deleted_at` filter to Marketplace** -- simple one-line fix
2. **Fix conversations query** -- limit messages or use `.limit(1)` per project approach
3. **Fix `<a>` to `<Link>`** in AuthModal for forgot-password

### Priority 2 (Robustness)  
4. **Consolidate toast system** -- pick one (sonner is more modern) and migrate all usages
5. **Fix `useMyDisputes`** to filter server-side instead of client-side
6. **Add deliverable acceptance check** -- check if ANY deliverable is accepted for project completion

### Priority 3 (Cleanup)
7. **Remove orphan pages** (`AssociationProfile.tsx`, `ProviderProfile.tsx`)
8. **Add redirect after signOut** in `useAuth`

---

## Summary

The codebase is generally well-structured with consistent RTL layout, role-based access, and proper RLS policies. The main issues are:
- 1 data bug (marketplace showing deleted services)
- 1 scalability issue (conversations query)  
- 1 navigation bug (forgot-password link)
- Several minor consistency improvements (toast system unification, dead code removal)

No critical security issues found. RLS policies are comprehensive and properly use `security definer` functions.

