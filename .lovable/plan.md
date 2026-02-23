

# Stage 4: Service Provider Features

This stage builds the complete UI for the **Service Provider** role -- users who offer services, bid on projects, log work hours, and track earnings.

---

## What Will Be Built

### 1. My Services Page (`/my-services`)
- List of provider's own micro-services with approval status badges (pending, approved, rejected)
- "Add New Service" button opening a creation form
- Edit/delete actions for own services
- Creation/edit form fields: title, description, category, region, service type (fixed-price/hourly), price
- Services require admin approval before appearing in the marketplace

### 2. Available Projects Page (`/available-projects`)
- Browse open (non-private) projects that providers can bid on
- Filter by category, region, and budget range
- Each project card shows: title, description snippet, budget, estimated hours, required skills, category, region
- Click to view full details and submit a bid

### 3. My Bids Page (`/my-bids`)
- List of all bids submitted by the provider with status indicators (pending, accepted, rejected, withdrawn)
- Filter by bid status
- Link to the associated project
- Withdraw action for pending bids

### 4. Time Tracking Page (`/time-tracking`)
- Log new work hours against assigned projects (projects where provider is `assigned_provider_id`)
- Form: select project, date, hours, description
- View history of submitted time logs with approval status
- Filter by project and date range

### 5. Earnings Page (`/earnings`)
- Summary of completed contracts and associated payments
- View escrow transaction history (held, released, refunded)
- Total earnings calculation
- Contract-level breakdown with project name and amount

### 6. Provider Dashboard
- Connect live data for the service_provider role:
  - My services count
  - Active bids count
  - Hours logged this month
  - Total earnings from released escrow

---

## New Files to Create

```text
src/pages/
  MyServices.tsx           -- Provider's service management
  AvailableProjects.tsx    -- Browse open projects
  MyBids.tsx               -- Provider's bid history
  TimeTracking.tsx         -- Log and view work hours
  Earnings.tsx             -- Earnings and payment tracking

src/components/services/
  ServiceForm.tsx          -- Create/edit micro-service form
  MyServiceCard.tsx        -- Service card with edit/delete actions

src/components/provider/
  BidForm.tsx              -- Submit bid on a project
  ProviderProjectCard.tsx  -- Project card for provider view
  TimeEntryForm.tsx        -- Form to log hours
  EarningsSummary.tsx      -- Earnings overview component

src/hooks/
  useMyServices.ts         -- CRUD hooks for provider's micro-services
  useProviderBids.ts       -- Hooks for provider's own bids
  useProviderTimeLogs.ts   -- Hooks for logging and viewing hours
  useEarnings.ts           -- Hook for earnings/escrow data
  useAvailableProjects.ts  -- Hook to fetch open projects
  useProviderStats.ts      -- Dashboard statistics hook
```

## Routes to Add

| Path | Component | Access |
|------|-----------|--------|
| `/my-services` | MyServices | service_provider |
| `/available-projects` | AvailableProjects | service_provider |
| `/available-projects/:id` | ProjectBidView | service_provider |
| `/my-bids` | MyBids | service_provider |
| `/time-tracking` | TimeTracking | service_provider |
| `/earnings` | Earnings | service_provider |

---

## Technical Details

### Data Fetching Patterns
```text
useMyServices()          -> supabase.from('micro_services').select('*, categories(*), regions(*)').eq('provider_id', user.id)
useAvailableProjects()   -> supabase.from('projects').select('*, categories(*), regions(*)').eq('status', 'open').eq('is_private', false)
useProviderBids()        -> supabase.from('bids').select('*, projects(title, budget)').eq('provider_id', user.id)
useProviderTimeLogs()    -> supabase.from('time_logs').select('*, projects(title)').eq('provider_id', user.id)
useEarnings()            -> supabase.from('escrow_transactions').select('*, projects(title)').eq('payee_id', user.id)
```

### Bid Submission Logic
- Provider submits a bid with price, timeline_days, and cover_letter
- Validation: price > 0, timeline_days > 0, cover_letter min 10 chars
- Provider can withdraw a pending bid (updates status to "withdrawn")
- Provider cannot bid on the same project twice

### Time Log Entry
- Provider selects from projects where they are `assigned_provider_id`
- Enters date, hours (positive number, max 24), and description
- New entries default to `approval: 'pending'`

### Service Form Validation (Zod)
- Title: required, min 5 chars
- Description: required, min 20 chars
- Price: positive number
- Category and region: required selections
- Service type: fixed_price or hourly

### Contract Signing
- When provider views an accepted bid, they can sign the contract (sets `provider_signed_at`)
- This completes the dual-signature flow started by the association

### Dashboard Live Data (Provider)
- Services count: `micro_services` where `provider_id = user.id`
- Active bids: `bids` where `provider_id = user.id` and `status = 'pending'`
- Hours this month: sum of `time_logs.hours` for current month
- Total earnings: sum of `escrow_transactions.amount` where `status = 'released'` and `payee_id = user.id`

### No Database Changes
All required tables and RLS policies already exist from Stage 2. The provider RLS policies (`provider_id = auth.uid()`) will govern data access.

