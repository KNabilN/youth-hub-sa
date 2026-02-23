

# Stage 3: Youth Association Features

This stage builds the complete UI experience for the **Youth Association** role -- the primary project creators on the platform. It connects the database tables from Stage 2 to interactive pages for managing projects, reviewing bids, signing contracts, verifying work hours, and browsing the service marketplace.

---

## What Will Be Built

### 1. Projects Management (4 pages)

**Projects List Page** (`/projects`)
- Table/card view of all association projects with status badges (draft, open, in_progress, completed, disputed)
- Filter bar by status, category, and date range
- "Create New Project" button leading to the creation form
- Quick actions: edit draft, view details, cancel

**Project Creation Form** (`/projects/new`)
- Multi-step form with validation (using react-hook-form + zod):
  - Step 1: Title, description, category (from `categories` table), region (from `regions` table)
  - Step 2: Required skills (tag input), estimated hours, budget (numeric with SAR currency)
  - Step 3: Privacy toggle, review summary
- Saves as "draft" initially, with option to publish (set status to "open")

**Project Details Page** (`/projects/:id`)
- Full project information display
- Tabs: Overview | Bids | Contract | Time Logs
- **Bids tab**: List of received bids with provider name, price, timeline, cover letter, and provider rating. Accept/reject buttons for each bid
- **Contract tab**: Shows contract details and signing status once a bid is accepted
- **Time Logs tab**: Provider-submitted hours with approve/reject controls

**Project Edit Page** (`/projects/:id/edit`)
- Same form as creation, pre-filled with existing data
- Only editable when project is in "draft" status

### 2. Bid Review & Contract Signing

**Bid Acceptance Flow**
- When association accepts a bid:
  1. All other bids on the project are automatically rejected
  2. A contract record is created linking the project, association, and provider
  3. Project status changes to "in_progress"
  4. Association signs the contract (sets `association_signed_at`)

**Contract View**
- Displays contract terms, signing timestamps for both parties
- Visual indicators showing which party has signed

### 3. Time Log Verification (`/time-logs`)

- List of all pending time logs across association's projects
- Each entry shows: provider name, project title, date, hours, description
- Approve/reject buttons with confirmation dialog
- Filter by project and approval status
- Summary statistics: total pending hours, approved this month

### 4. Service Marketplace (`/marketplace`)

- Grid/card layout of approved micro-services
- Filter by category, region, service type (fixed-price/hourly), price range
- Service detail modal/page with provider info, ratings, and price
- "Request Service" action (placeholder for future procurement flow)

### 5. Ratings Page (`/ratings`)

- List of completed contracts eligible for rating
- Rating form with three sliders (quality, timing, communication) each 1-5
- Optional comment field
- View previously submitted ratings

### 6. Dashboard Enhancements

- Connect the static "0" values to real Supabase queries:
  - Active projects count (status = in_progress)
  - Pending time log hours
  - Active contracts count
  - Average rating received

---

## New Files to Create

```text
src/pages/
  Projects.tsx            -- Project listing page
  ProjectCreate.tsx       -- Multi-step project creation form
  ProjectDetails.tsx      -- Project detail with tabs (bids, contract, time logs)
  ProjectEdit.tsx         -- Edit draft project
  TimeLogs.tsx            -- Time log review page
  Marketplace.tsx         -- Service marketplace browser
  Ratings.tsx             -- Ratings management page

src/components/projects/
  ProjectCard.tsx         -- Reusable project card component
  ProjectForm.tsx         -- Shared form for create/edit
  ProjectStatusBadge.tsx  -- Color-coded status badge

src/components/bids/
  BidCard.tsx             -- Individual bid display with actions
  BidList.tsx             -- List of bids for a project

src/components/time-logs/
  TimeLogTable.tsx        -- Table of time log entries with actions

src/components/marketplace/
  ServiceCard.tsx         -- Micro-service card for grid display
  ServiceFilters.tsx      -- Filter controls for marketplace

src/hooks/
  useProjects.ts          -- React Query hooks for project CRUD
  useBids.ts              -- React Query hooks for bid operations
  useTimeLogs.ts          -- React Query hooks for time log queries
  useCategories.ts        -- Hook to fetch categories
  useRegions.ts           -- Hook to fetch regions
```

## Routes to Add

| Path | Component | Access |
|------|-----------|--------|
| `/projects` | Projects | youth_association |
| `/projects/new` | ProjectCreate | youth_association |
| `/projects/:id` | ProjectDetails | youth_association |
| `/projects/:id/edit` | ProjectEdit | youth_association |
| `/time-logs` | TimeLogs | youth_association |
| `/marketplace` | Marketplace | youth_association |
| `/ratings` | Ratings | youth_association |

---

## Technical Details

### Data Fetching Pattern
All data fetching will use `@tanstack/react-query` with custom hooks wrapping Supabase client calls. Example pattern:

```text
useProjects() -> supabase.from('projects').select('*, categories(*), regions(*)').eq('association_id', user.id)
useBids(projectId) -> supabase.from('bids').select('*, profiles(full_name, avatar_url)').eq('project_id', projectId)
```

### Bid Acceptance Logic
When a bid is accepted, the hook will execute a sequence:
1. Update accepted bid status to "accepted"
2. Update all other bids on the project to "rejected"
3. Insert a new contract record
4. Update project status to "in_progress" and set `assigned_provider_id`

### Form Validation (Zod Schemas)
- Project title: required, min 5 chars
- Description: required, min 20 chars
- Budget: positive number
- Estimated hours: positive number
- Timeline days (bids): positive integer
- Rating scores: integer 1-5

### RTL Considerations
- All form layouts use RTL-aware flex and grid
- Table columns ordered right-to-left
- Currency displays as "500 ر.س" (number first, then symbol)
- Date formatting using date-fns with Arabic locale

### Dashboard Live Data
The Dashboard page will be updated to use React Query hooks that count real records from the database instead of showing static "0" values.
