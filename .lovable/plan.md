

## Plan: Toggle Association Name Visibility (Admin)

### What
Add a toggle (Switch) per row in the admin projects table that lets the admin show or hide the association's name. This requires a new `is_name_visible` boolean column on the `profiles` table, defaulting to `true`.

### Database Change
Add column `is_name_visible` (boolean, default `true`, not null) to `profiles` table via migration.

### Files to Modify

1. **`src/pages/admin/AdminProjects.tsx`**
   - Import `Switch` component
   - Add a new column header "إظهار الاسم" in the table
   - Add a `Switch` per row, checked based on the association profile's `is_name_visible` value
   - On toggle, call a mutation to update `profiles.is_name_visible` for the association

2. **`src/hooks/useAdminProjects.ts`**
   - Update the select query to include `profiles!projects_association_id_fkey(full_name, is_name_visible)`
   - Add a new mutation `useToggleAssociationVisibility` that updates `profiles.is_name_visible`

3. **Public-facing pages** (e.g., `ProjectPublicView`, `Associations`, landing page) — where association names appear, conditionally hide based on `is_name_visible`.

### UI
- The Switch appears in a new "إظهار الاسم" column between "الجمعية" and "التصنيف"
- Toggling instantly updates the profile and shows a success toast
- `colSpan` updated from 8 to 9

