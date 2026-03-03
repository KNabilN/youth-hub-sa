

## Plan: Allow Multiple Deliverable Submissions

### Problem
Currently, the system only allows one deliverable record per project. After acceptance, the provider cannot submit again. The `canSubmit` check on line 34 blocks submission when `deliverable.status === "accepted"`. The hook fetches only the latest single deliverable via `.limit(1).maybeSingle()`.

### Changes

#### 1. `src/hooks/useDeliverables.ts`
- Change `useDeliverable` to `useDeliverables` — fetch **all** deliverable records for the project (ordered newest first), not just one.
- Keep the single-deliverable query as well for backward compat, pointing to the latest one.
- Update `useSubmitDeliverable` to always **insert a new row** instead of updating the existing one. Each submission becomes a new version.
- Remove the "check existing and update" logic.

#### 2. `src/components/deliverables/DeliverablePanel.tsx`
- Allow the provider to submit new deliverables even after acceptance (`canSubmit = isProvider`, always available).
- Show a history/timeline of all deliverable submissions (version 1, 2, 3...) with their statuses.
- The latest deliverable is the "active" one for review purposes.
- Association can only review the latest `pending_review` deliverable.
- Each deliverable version shows its own attachments (linked by deliverable ID).

#### 3. Attachment display
- Each deliverable version's files are already scoped by `entityId` (the deliverable row ID), so multiple submissions naturally have separate file lists.

### Files to modify
| File | Change |
|------|--------|
| `src/hooks/useDeliverables.ts` | Fetch all deliverables, always insert new row on submit |
| `src/components/deliverables/DeliverablePanel.tsx` | Show submission history, allow re-submit after acceptance |

