

## Plan: Project Deliverables (File Delivery) System

### Concept

When a project reaches the completion phase, the provider should submit deliverable files for the association to review before the project is marked as completed. This adds a formal handoff step.

### Flow

```text
Provider                        Association                   System
────────                        ───────────                   ──────
1. Uploads deliverables         3. Reviews deliverables       5. On acceptance:
   (new "deliverables" tab)     4. Accept or Request             - mark delivered
2. Marks "ready for review"        Revisions                     - allow "Complete"
                                                                  button
```

### Implementation

#### 1. New DB table: `project_deliverables`

```sql
CREATE TABLE public.project_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending_review',  -- pending_review, accepted, revision_requested
  notes text DEFAULT '',
  reviewed_at timestamptz,
  revision_note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;
```

RLS: Provider and association of the project can SELECT; provider can INSERT/UPDATE (own); association can UPDATE status; admin full access.

Deliverable **files** will use the existing `attachments` system with a new `entity_type = 'deliverable'`, linked to the deliverable record's ID. No new storage bucket needed.

#### 2. Update completion gate

Currently, `handleComplete` in `ProjectDetails.tsx` only checks for held escrow. Add a second check: a deliverable record must exist with `status = 'accepted'` before completion is allowed. This ensures the association reviewed files before releasing payment.

#### 3. New "التسليمات" (Deliverables) tab in ProjectDetails

- **Provider view** (`in_progress` status): Upload files via existing `FileUploader` (entity_type = "deliverable"), add notes, and submit for review.
- **Association view**: See uploaded files, download them, then Accept or Request Revisions (with a reason). On revision request, provider sees the note and can re-upload.
- **Both**: See the current deliverable status and history.

#### 4. Notification trigger

A DB trigger `notify_on_deliverable_change` fires on INSERT and UPDATE of `project_deliverables`:
- INSERT (provider submits) → notify association
- UPDATE to `accepted` → notify provider
- UPDATE to `revision_requested` → notify provider with revision note

#### 5. Update `useAttachments` EntityType

Add `"deliverable"` to the `EntityType` union and update the RLS policy on `attachments` to allow access for deliverable-linked files (project parties).

### Files to Create/Modify

| File | Action |
|------|--------|
| DB migration | Create `project_deliverables` table + RLS + trigger |
| `src/hooks/useDeliverables.ts` | New hook: CRUD for deliverables |
| `src/components/deliverables/DeliverablePanel.tsx` | New component: upload + review UI |
| `src/pages/ProjectDetails.tsx` | Add "التسليمات" tab, gate completion on accepted deliverable |
| `src/hooks/useAttachments.ts` | Add `"deliverable"` to EntityType |
| `attachments` RLS policy | Update "Users view related attachments" to include deliverable entity type |

### Summary

This adds a formal deliverable handoff step between provider and association. The provider uploads final files, the association reviews and accepts (or requests changes), and only then can the project be completed and payment released. All built on top of the existing attachments infrastructure.

