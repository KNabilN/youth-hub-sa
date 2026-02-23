

# Stage 10: Final Polish -- Consistent Loading and Empty States Across All Pages

Stages 1-9 built all features and core business logic. The `EmptyState` component and `Skeleton` loaders were introduced in Stage 9 but only applied to a few pages. Many pages still use plain text for loading and empty states. This stage standardizes every remaining page.

---

## Current Gaps

The following pages still use plain text `"جاري التحميل..."` or `"لا توجد ..."` instead of proper `Skeleton` loaders and the reusable `EmptyState` component:

| Page | Loading Issue | Empty State Issue |
|------|--------------|-------------------|
| `Notifications.tsx` | Plain text | Plain text |
| `SupportTickets.tsx` | Plain text | Plain text |
| `Contracts.tsx` | Plain text | Plain text |
| `Associations.tsx` | Plain text | Plain text |
| `AvailableProjects.tsx` | Plain text | Plain text |
| `TimeTracking.tsx` | Plain text (in cards) | Plain text |
| `Donations.tsx` | Plain text (in cards) | Plain text |
| `ImpactReports.tsx` | Plain text | Plain text |
| `Profile.tsx` | Plain text | N/A |

Pages already using Skeleton/EmptyState (no changes needed): `Dashboard`, `Projects`, `MyServices`, `MyBids`, `Earnings`, `Marketplace`, `Ratings`.

---

## What Will Be Done

### 1. Add Skeleton Loaders
Replace every `"جاري التحميل..."` text with appropriate `Skeleton` components matching the layout of each page (cards, tables, or lists).

### 2. Add EmptyState Components
Replace every plain `"لا توجد ..."` text with the reusable `EmptyState` component, including relevant icons and CTAs where appropriate:
- **Notifications**: Bell icon, no CTA
- **Support Tickets**: MessageSquare icon, CTA to create ticket
- **Contracts**: FileText icon, no CTA
- **Associations**: Users icon, no CTA
- **Available Projects**: FolderKanban icon, no CTA
- **Time Tracking**: ClipboardList icon, no CTA
- **Donations**: HandCoins icon, no CTA
- **Impact Reports**: BarChart3 icon, CTA to donations page

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Notifications.tsx` | Skeleton loader + EmptyState |
| `src/pages/SupportTickets.tsx` | Skeleton loader + EmptyState with CTA |
| `src/pages/Contracts.tsx` | Skeleton loader + EmptyState |
| `src/pages/Associations.tsx` | Skeleton loader + EmptyState |
| `src/pages/AvailableProjects.tsx` | Skeleton loader + EmptyState |
| `src/pages/TimeTracking.tsx` | Skeleton loaders in both cards |
| `src/pages/Donations.tsx` | Skeleton loader in history card |
| `src/pages/ImpactReports.tsx` | Skeleton loader + EmptyState |
| `src/pages/Profile.tsx` | Skeleton loader |

## No New Files or Database Changes

All changes are purely presentational using existing components (`Skeleton`, `EmptyState`).

---

## Technical Details

### Pattern for Each Page

Each page follows the same replacement pattern:

```text
Loading state:
  Before: <p className="text-muted-foreground">جاري التحميل...</p>
  After:  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>

Empty state:
  Before: <p className="text-muted-foreground">لا توجد ...</p>
  After:  <EmptyState icon={RelevantIcon} title="..." description="..." actionLabel="..." actionHref="..." />
```

Skeleton heights will match the expected content:
- Card-based pages (Contracts, Tickets, Time logs): `h-20`
- Grid-based pages (Associations, Available Projects): `h-44` in a grid
- Table-based pages (Donations, Impact): `h-10` rows
- Profile page: `h-64` single card skeleton

