

## Investigation: Provider Seeing Other Providers' Bids

### Root Cause

The `ProjectDetails.tsx` page renders `<BidList projectId={...} />` unconditionally for all users. The `BidCard` component also renders accept/reject buttons for all users with `bid.status === "pending"`, regardless of role.

While RLS on the `bids` table has a policy "Providers manage own bids" (`provider_id = auth.uid()`), the fact that all bids are visible suggests the policies may be functioning as PERMISSIVE (OR'd), and another policy path is granting access. Additionally, the assigned provider has SELECT access to the project, and the bids query joins `profiles`, which may satisfy a broader access path.

Regardless of the RLS behavior, the UI should enforce role-appropriate visibility.

### Fix

**1. `src/components/bids/BidList.tsx`** -- Accept `role` and `userId` props. When the viewer is a `service_provider`, filter bids client-side to only show their own bid(s). This is defense-in-depth alongside RLS.

**2. `src/components/bids/BidCard.tsx`** -- Only render accept/reject buttons when the viewer is the association owner (`isAssociation` prop), not for providers viewing their own bids.

**3. `src/pages/ProjectDetails.tsx`** -- Pass `role` and `user.id` to `BidList`. For providers, change the bids tab label to "عرضي" (My Bid) instead of "العروض" (Bids). Hide association-only actions (complete, cancel) which are already gated but reinforce with clearer conditional rendering.

### Summary of Changes
- `BidList.tsx`: Filter bids to provider's own when role is `service_provider`
- `BidCard.tsx`: Accept `showActions` prop; only show accept/reject when true
- `ProjectDetails.tsx`: Pass role context to BidList, adjust tab label for providers

