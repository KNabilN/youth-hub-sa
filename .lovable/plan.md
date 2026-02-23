

# Stage 5: Shared Features and Cross-Role Pages

With Stages 1-4 complete (Foundation, Database, Youth Association, Service Provider), this stage builds the **shared features** used across all roles -- Notifications, Support Tickets, and the Donor role pages -- plus prepares the groundwork for the Super Admin stage.

---

## What Will Be Built

### 1. Notifications Page (`/notifications`)
- Real-time notification list using the `notifications` table (already realtime-enabled)
- Mark individual notifications as read
- Mark all as read
- Unread count badge in the sidebar
- Notification types displayed with appropriate icons

### 2. Support Tickets Page (`/tickets`)
- List of user's own support tickets with status/priority badges
- "New Ticket" form: subject, description, priority selection
- Ticket detail view with status updates
- Available to all authenticated roles

### 3. Donor Pages

**Associations Browser (`/associations`)**
- Browse verified youth associations (profiles where role = youth_association and is_verified = true)
- View association details: name, bio, project count

**Donations Page (`/donations`)**
- Make a contribution to a project or service (creates `donor_contributions` record)
- View donation history with amounts and dates
- Filter by date range

**Impact Reports (`/impact`)**
- Summary dashboard showing: total donated, number of projects funded, associations supported
- Breakdown by project with status indicators

### 4. Donor Dashboard
- Connect live data:
  - Associations supported count
  - Total donations amount
  - Projects funded count
  - Impact reports (placeholder metric)

---

## New Files to Create

```text
src/pages/
  Notifications.tsx        -- Notification center
  SupportTickets.tsx       -- Support ticket management
  TicketCreate.tsx         -- New ticket form
  Associations.tsx         -- Browse associations (donor)
  Donations.tsx            -- Donation history and new contribution
  ImpactReports.tsx        -- Donor impact dashboard

src/components/notifications/
  NotificationItem.tsx     -- Single notification row
  NotificationBadge.tsx    -- Unread count badge for sidebar

src/components/tickets/
  TicketCard.tsx           -- Support ticket card
  TicketForm.tsx           -- Create ticket form

src/components/donor/
  AssociationCard.tsx      -- Association profile card
  DonationForm.tsx         -- Contribution form
  ImpactSummary.tsx        -- Impact statistics component

src/hooks/
  useNotifications.ts      -- Realtime notifications hook
  useSupportTickets.ts     -- CRUD for support tickets
  useDonorContributions.ts -- Donation data hook
  useDonorStats.ts         -- Donor dashboard statistics
```

## Routes to Add

| Path | Component | Access |
|------|-----------|--------|
| `/notifications` | Notifications | all authenticated |
| `/tickets` | SupportTickets | all authenticated |
| `/tickets/new` | TicketCreate | all authenticated |
| `/associations` | Associations | donor |
| `/donations` | Donations | donor |
| `/impact` | ImpactReports | donor |

---

## Technical Details

### Notifications (Realtime)
```text
useNotifications() -> supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
```
- Subscribe to `postgres_changes` on the `notifications` table filtered by `user_id`
- New notifications appear instantly without page refresh
- Unread count: `notifications` where `is_read = false`

### Support Tickets
```text
useSupportTickets() -> supabase.from('support_tickets').select('*').eq('user_id', user.id)
createTicket()      -> supabase.from('support_tickets').insert({ subject, description, priority, user_id })
```
- Zod validation: subject (min 5 chars), description (min 10 chars), priority enum

### Donor Contributions
```text
useDonorContributions() -> supabase.from('donor_contributions').select('*, projects(title), micro_services(title)').eq('donor_id', user.id)
createContribution()    -> supabase.from('donor_contributions').insert({ donor_id, project_id?, service_id?, amount })
```
- Amount must be positive
- Either project_id or service_id must be provided (not both)

### Donor Dashboard Stats
```text
useDonorStats():
  - Total donations: sum of donor_contributions.amount
  - Projects funded: distinct project_id count from donor_contributions
  - Associations supported: distinct association_id from projects joined through donor_contributions
```

### Sidebar Updates
- Add `NotificationBadge` component showing unread count next to the notifications link
- All sidebar notification/ticket links already exist in `AppSidebar.tsx`

### No Database Changes
All required tables (`notifications`, `support_tickets`, `donor_contributions`) and their RLS policies already exist from Stage 2.

