

# Stage 7: Contracts Page and Missing Feature Polish

With Stages 1-6 complete, the platform has all four role dashboards, admin panel, notifications, support tickets, and donor features working. However, there is a broken sidebar link (`/contracts`) with no corresponding page, and several integration gaps that need closing. This stage fills those gaps.

---

## What Will Be Built

### 1. Contracts Page (`/contracts`) -- Youth Association
The sidebar for `youth_association` links to `/contracts` but no page or route exists. This stage creates:
- List of all contracts belonging to the association with status indicators (unsigned, partially signed, fully signed)
- Contract details: project title, provider name, terms, signature timestamps
- Association sign action: set `association_signed_at` for unsigned contracts
- Filter by signature status
- Link to the associated project

### 2. Provider Contract Signing
Currently providers have no way to sign contracts from their side. Add a contract signing section to the provider's "My Bids" page or a dedicated contracts view:
- When a bid is accepted and a contract exists, show "Sign Contract" button
- Sets `provider_signed_at` on the contract
- Visual indicators for signature status

### 3. User Profile Page (`/profile`)
No profile management page exists for any role. Add:
- View and edit `full_name` and `bio` fields from `profiles` table
- Display current role (read-only)
- Display verification status (read-only)
- Accessible from sidebar for all roles

### 4. Dispute Creation
The `disputes` table exists and admin can manage disputes, but there is no way for users to create disputes. Add:
- "Raise Dispute" button on completed/in-progress projects
- Simple form: description text
- Creates a record in `disputes` with `raised_by = user.id` and `status = 'open'`
- Available to both `youth_association` and `service_provider` roles

### 5. Sidebar Profile Link
Add a profile/settings link to the shared sidebar section (below notifications and support tickets) for all roles.

---

## New Files to Create

```text
src/pages/
  Contracts.tsx            -- Association's contract list
  Profile.tsx              -- User profile management

src/components/contracts/
  ContractCard.tsx         -- Contract display with sign action

src/hooks/
  useContracts.ts          -- Contract queries and mutations
  useProfile.ts            -- Profile read/update hook
  useDisputes.ts           -- Dispute creation hook
```

## Routes to Add

| Path | Component | Access |
|------|-----------|--------|
| `/contracts` | Contracts | youth_association |
| `/profile` | Profile | all authenticated |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/contracts` and `/profile` routes |
| `src/components/AppSidebar.tsx` | Add profile link to shared section |
| `src/pages/ProjectDetails.tsx` | Add "Raise Dispute" button |
| `src/pages/MyBids.tsx` | Add contract signing for accepted bids |

---

## Technical Details

### Contracts Hook
```text
useContracts() -> supabase.from('contracts')
  .select('*, projects(title, status), profiles:provider_id(full_name)')
  .eq('association_id', user.id)
  .order('created_at', { ascending: false })

signContract(contractId, role) ->
  if role === 'youth_association':
    .update({ association_signed_at: new Date().toISOString() }).eq('id', contractId)
  if role === 'service_provider':
    .update({ provider_signed_at: new Date().toISOString() }).eq('id', contractId)
```

### Contract Status Logic
- **Unsigned**: neither party has signed
- **Partially signed**: one party has signed (`association_signed_at` or `provider_signed_at` is set)
- **Fully signed**: both timestamps are set

### Profile Hook
```text
useProfile() -> supabase.from('profiles').select('*').eq('id', user.id).single()
updateProfile({ full_name, bio }) -> supabase.from('profiles').update({ full_name, bio }).eq('id', user.id)
```

### Dispute Creation
```text
createDispute({ project_id, description }) -> supabase.from('disputes').insert({
  project_id,
  description,
  raised_by: user.id,
  status: 'open'
})
```
- Also updates the project status to `disputed` via a second call

### Provider Contract Signing in MyBids
- When a bid has `status = 'accepted'`, fetch the associated contract
- If `provider_signed_at` is null, show a "Sign Contract" button
- On click, update the contract with `provider_signed_at = now()`

### No Database Changes
All tables (`contracts`, `profiles`, `disputes`) and their RLS policies already exist from Stage 2. The existing policies allow users to manage their own records.

