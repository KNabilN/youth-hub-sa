

# Fix: Region/City Filters Not Persisting in Reports

## Problem
When selecting a region or city filter, data appears filtered for a moment then reverts to unfiltered results. This is caused by a **race condition** between queries.

## Root Cause
Several queries (donations, escrow, contracts, donor analytics, insights) depend on `regionProjectIds` - a separate query that fetches project IDs for the selected region/city. When filters change:

1. ALL queries refetch simultaneously
2. `regionProjectIds` hasn't resolved yet, so dependent queries see `undefined` and skip the filter
3. They return unfiltered data
4. When `regionProjectIds` resolves, dependent queries don't refetch because their `queryKey` didn't change

## Solution

### File: `src/pages/admin/AdminReports.tsx`

**Change 1: Add `regionProjectIds` to queryKeys of all dependent queries**

Add `regionProjectIds` to the queryKey array of these queries so they automatically refetch when the project IDs resolve:
- `monthlyDonations` (line 147)
- `monthlyEscrow` (line 208)
- `donorAnalytics` (line 244)
- `insights` (line 288)

For example, change:
```typescript
queryKey: ["admin-report-donations", dateFrom, dateTo, regionId, cityId]
```
to:
```typescript
queryKey: ["admin-report-donations", dateFrom, dateTo, regionId, cityId, regionProjectIds]
```

**Change 2: Disable dependent queries while `regionProjectIds` is loading**

Add `enabled` condition to prevent queries from executing with stale data when a region/city filter is active but project IDs haven't loaded yet:

```typescript
enabled: !(regionId || cityId) || regionProjectIds !== undefined,
```

This means: run the query if no region filter is active, OR if region filter is active AND project IDs are loaded.

Apply this to: `monthlyDonations`, `monthlyEscrow`, `donorAnalytics`, and `insights`.

### Queries Affected (4 queries)
| Query | Line | Fix |
|---|---|---|
| `monthlyDonations` | 147 | Add to queryKey + enabled |
| `monthlyEscrow` | 208 | Add to queryKey + enabled |
| `donorAnalytics` | 244 | Add to queryKey + enabled |
| `insights` | 288 | Add to queryKey + enabled |

### Queries NOT affected (already filter directly, no dependency on regionProjectIds)
- `projectsByStatus` - filters by `region_id`/`city_id` directly
- `servicesByCategory` - filters by `region_id`/`city_id` directly
- `serviceApprovalStats` - filters by `region_id`/`city_id` directly
- `usersByRole` - not region-dependent
- `projectsByRegion` - not region-filtered
- `hourlyRateData` - not region-dependent

