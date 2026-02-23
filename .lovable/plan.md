

# Stage 2: Core Database & Domain Models

This stage creates all the database tables needed for the platform's business logic -- projects, services, bidding, contracts, finances, and more.

---

## What Will Be Built

### 1. Lookup Tables (Admin-managed)
- **categories** -- Service/project categories (e.g., تقنية, تسويق, تصميم)
- **regions** -- Saudi regions (e.g., الرياض, جدة, الدمام)

### 2. Project & Service Tables
- **projects** -- Association-created project requests with title, description, required skills, estimated hours, budget, status (draft/open/in_progress/completed/disputed), privacy toggle, and links to association and assigned provider
- **micro_services** -- Provider-created fixed-price or hourly services with description, pricing, category, region, and approval status
- **bids** -- Provider proposals on projects with price, timeline, cover letter, and status (pending/accepted/rejected)
- **contracts** -- System-generated digital agreements linking a project to an association and provider, with signing timestamps

### 3. Work Tracking
- **time_logs** -- Hourly work entries by providers, linked to projects, with hours logged, description, date, and approval status (pending/approved/rejected)

### 4. Quality & Governance
- **ratings** -- Three-dimensional evaluation (quality, timing, communication) with scores 1-5, linked to contracts
- **disputes** -- Dispute records with status (open/under_review/resolved), description, resolution notes
- **audit_log** -- Immutable record of all system changes (table name, record ID, action, old/new values, actor)

### 5. Financial Tables
- **escrow_transactions** -- Funds held/released/frozen, linked to projects or services, with status tracking
- **invoices** -- ZATCA-style electronic invoice records for platform commissions
- **commission_config** -- Admin-configurable platform fee rates (percentage-based)
- **donor_contributions** -- Donations linked to specific projects or services, with donor ID and amount

### 6. Notifications & Ticketing
- **notifications** -- In-app notification records per user with type, message, read status
- **support_tickets** -- Internal ticketing system with subject, description, status, priority

---

## Security (RLS Policies)

Each table will have Row-Level Security policies:
- **projects**: Associations manage their own; providers see open projects; admins see all
- **micro_services**: Providers manage their own; all authenticated users can browse approved ones; admins see all
- **bids**: Providers manage their own bids; associations see bids on their projects; admins see all
- **contracts**: Parties to the contract can view; admins see all
- **time_logs**: Providers create on their projects; associations approve on their projects; admins see all
- **ratings**: Creator can insert; public read on completed contracts
- **disputes**: Involved parties can view/create; admins manage all
- **escrow/invoices/contributions**: Role-appropriate access with admin full access
- **notifications**: Users see only their own
- **support_tickets**: Creator sees own; admins see all
- **categories/regions**: Public read; admin write
- **audit_log**: Admin read-only; system insert via trigger
- **commission_config**: Admin read/write

---

## Technical Details

### Migration SQL
A single migration will create all tables, enums (for statuses), RLS policies, and indexes. Key design decisions:
- All user-referencing columns use `uuid` type referencing `profiles(id)` (not `auth.users`)
- Status fields use PostgreSQL enums for type safety
- `audit_log` will use a trigger function to auto-capture changes
- Timestamps default to `now()` with timezone
- Financial amounts stored as `numeric(12,2)` for precision
- Realtime enabled on `notifications` table for live updates

### New Enums
- `project_status`: draft, open, in_progress, completed, disputed, cancelled
- `bid_status`: pending, accepted, rejected, withdrawn
- `service_type`: fixed_price, hourly
- `approval_status`: pending, approved, rejected
- `dispute_status`: open, under_review, resolved, closed
- `escrow_status`: held, released, frozen, refunded
- `ticket_status`: open, in_progress, resolved, closed
- `ticket_priority`: low, medium, high, urgent

### No UI Changes in This Stage
This is a pure database/schema stage. The frontend will be updated in Stages 3-6 to consume these tables.

