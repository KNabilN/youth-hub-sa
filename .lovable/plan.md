

## Plan: Make user names clickable in all 4 finance tabs

### What changes
In `src/pages/admin/AdminFinance.tsx`, wrap every user name cell across all 4 tabs with a `Link` (from `react-router-dom`) pointing to `/admin/users/{userId}` so the admin can click through to review the user's full profile.

### Mapping per tab

1. **Escrow (الضمان)** — Lines 305-306:
   - "المستفيد" (payee): `e.payee_id` → `/admin/users/${e.payee_id}`
   - "الدافع" (payer): `e.payer_id` → `/admin/users/${e.payer_id}`

2. **Invoices (الفواتير)** — Line 388:
   - "المستلم": `inv.issued_to` → `/admin/users/${inv.issued_to}`

3. **Withdrawals (طلبات السحب)** — Line 490:
   - "مقدم الخدمة": `w.provider_id` → `/admin/users/${w.provider_id}`

4. **Bank Transfers (التحويلات البنكية)** — Line 588:
   - "المستخدم": `bt.user_id` → `/admin/users/${bt.user_id}`

### Style
Each name will be rendered as a `Link` with `text-primary hover:underline font-medium` styling for clear clickability, consistent with other admin clickable elements.

### Navigation
The admin user detail page (`/admin/users/:id`) already exists with a back button, so back-and-forth navigation is already handled.

### Import
Add `Link` from `react-router-dom` to the existing imports.

