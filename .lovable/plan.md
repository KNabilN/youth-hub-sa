

# Stage 15: Service Provider Pages UI Enhancement

Upgrade all service provider ("مزودي الخدمة") pages from their current plain/functional state to a polished, professional design matching the governmental design system established in Stage 14.

---

## Pages to Enhance

| Page | Current Issue |
|------|--------------|
| خدماتي (MyServices) | Plain cards, no visual accents, flat layout |
| المشاريع المتاحة (AvailableProjects) | Basic filter bar, plain project cards |
| عروضي (MyBids) | Simple list with no visual hierarchy |
| تسجيل الساعات (TimeTracking) | Flat cards, bare time log list, no page header decoration |
| الأرباح (Earnings) | Basic summary, flat withdrawal list |

---

## Enhancement Details

### 1. Page Headers -- All Provider Pages
Replace simple `<h1>` headings with decorated page headers featuring:
- Icon with colored circular background beside the title
- Subtitle/description text
- Gradient accent line beneath

### 2. TimeTracking Page
- Decorated page header with Clock icon in colored circle
- "تسجيل ساعات جديدة" card: add `border-r-4 border-primary` accent, subtle gradient header background
- Time log entries: replace plain border-b dividers with individual mini-cards with colored approval status indicator (left border color matches status)
- Add summary stats bar at top: total hours this month, pending hours, approved hours

### 3. MyServices Page
- Page header with Layers icon + gradient accent
- Service cards: add `card-hover` class, colored top border based on approval status (green=approved, yellow=pending, red=rejected)
- Price displayed as a styled tag/chip
- Category and region as subtle pill badges
- Action buttons with better spacing and icon-only hover tooltips

### 4. AvailableProjects Page
- Page header with FolderKanban icon
- Filter bar: styled in a subtle card/panel with rounded corners and soft background
- Project cards: add `card-hover`, budget displayed as accent-colored chip, skills as colored outline badges
- CTA button with gradient styling

### 5. MyBids Page
- Page header with FileText icon
- Filter dropdown in a styled toolbar panel
- Bid cards: status-colored right border (RTL), price and timeline in styled chips
- Contract signing section: highlighted with primary background when action needed
- Better visual separation between bid details and actions

### 6. Earnings Page
- Page header with Wallet icon
- Total earnings card: gradient background with large bold number
- Transaction list items: status-colored right border, amount in accent color
- Withdrawal requests: styled cards with status indicator dots
- Withdrawal dialog: polished with available balance highlight

### 7. Provider Components Enhancement
- `ProviderProjectCard`: add `card-hover`, gradient CTA button, better skill badge colors
- `MyServiceCard`: status-colored top border, hover lift effect, styled price tag
- `TimeEntryForm`: better form field styling with icons in labels
- `EarningsSummary`: gradient total card, timeline-style transaction list
- `BidForm`: polished form with section headers

---

## Technical Details

### Page Header Pattern (reused across all pages)

```text
<div className="flex items-center gap-4 mb-6">
  <div className="p-3 rounded-xl bg-primary/10">
    <Icon className="h-7 w-7 text-primary" />
  </div>
  <div>
    <h1 className="text-2xl font-bold">Page Title</h1>
    <p className="text-sm text-muted-foreground">Subtitle</p>
  </div>
</div>
```

### Status Border Colors

```text
Approval/Status mapping:
  pending  -> border-yellow-500
  approved -> border-emerald-500
  rejected -> border-red-500
  accepted -> border-emerald-500
  withdrawn -> border-gray-400
  held     -> border-yellow-500
  released -> border-emerald-500
  frozen   -> border-blue-500
  refunded -> border-red-500
```

### Earnings Gradient Card

```text
Total earnings card:
  background: gradient from primary/5 to primary/10
  border-r-4 border-primary
  Large text: text-3xl font-bold text-primary
  Subtitle: "اجمالي الارباح المصروفة"
```

### Time Log Summary Stats Bar

```text
Three mini stat cards in a row:
  1. Total hours this month (all statuses)
  2. Approved hours (green accent)
  3. Pending hours (yellow accent)
Each: icon + value + label, with colored icon background
```

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/pages/TimeTracking.tsx` -- decorated header, summary stats, styled log entries |
| Modify | `src/pages/MyServices.tsx` -- decorated header, enhanced layout |
| Modify | `src/pages/AvailableProjects.tsx` -- decorated header, styled filter panel |
| Modify | `src/pages/MyBids.tsx` -- decorated header, styled bid cards with status borders |
| Modify | `src/pages/Earnings.tsx` -- decorated header, gradient total card, styled withdrawals |
| Modify | `src/components/services/MyServiceCard.tsx` -- status top border, hover effects, styled price |
| Modify | `src/components/provider/ProviderProjectCard.tsx` -- card-hover, gradient CTA, better badges |
| Modify | `src/components/provider/EarningsSummary.tsx` -- gradient total, timeline transactions |
| Modify | `src/components/provider/TimeEntryForm.tsx` -- polished form with icons |
| Modify | `src/components/provider/BidForm.tsx` -- polished form styling |

No database migrations required.

