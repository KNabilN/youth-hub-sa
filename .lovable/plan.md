
# Role-Aware Admin User Detail Page

## Problem
Currently, the Admin User Detail page (`AdminUserDetail.tsx`) and the `UserDetailSheet.tsx` show identical tabs and profile fields for ALL user roles. This means:
- **Associations** see "Services" and "Time Logs" tabs (irrelevant -- they don't provide services or log time)
- **Service Providers** see "Organization Name" and "License Number" fields (these are association-specific)
- **Donors** see Services, Projects, Contracts, Time Logs, and Disputes tabs (they only have contributions)
- **Hourly Rate** shows for associations and donors (only relevant for providers)
- The edit dialog shows all fields for all roles (e.g., hourly_rate for associations)

## Solution
Conditionally show tabs, profile fields, and edit fields based on the user's role.

### Role-to-Tab Mapping

| Tab | Service Provider | Association | Donor | Admin |
|-----|-----------------|-------------|-------|-------|
| Profile | Yes | Yes | Yes | Yes |
| Services | Yes | No | No | No |
| Projects (Requests) | Yes (assigned) | Yes (owned) | No | No |
| Contracts | Yes | Yes | No | No |
| Disputes | Yes | Yes | No | No |
| Time Logs | Yes | No | No | No |
| Contributions/Grants | No | No | Yes | No |
| Edit Requests | Yes | Yes | Yes | Yes |
| Activity Log | Yes | Yes | Yes | Yes |

### Role-to-Profile-Fields Mapping

**Service Provider fields:**
- Full Name, Phone, Bio, Hourly Rate, Skills

**Association fields:**
- Full Name, Phone, Organization Name, License Number, Contact Officer (name, phone, email, title), Bio

**Donor fields:**
- Full Name, Phone, Organization Name, Bio

### Technical Changes

#### 1. `src/pages/admin/AdminUserDetail.tsx`
- Use the `role` variable to conditionally render tabs (hide Services/TimeLogs for non-providers, hide irrelevant tabs for donors)
- Split profile fields into role-specific sections:
  - Show "Organization Info" card (org name, license) only for associations
  - Show "Contact Officer" card only for associations
  - Show "Provider Info" (hourly rate, skills) only for providers
  - Keep "Basic Info" (name, phone, bio) for all
- Filter `profileFields` for the edit dialog based on role

#### 2. `src/components/admin/UserDetailSheet.tsx`
- Apply the same role-based tab filtering
- Apply role-based profile field filtering

#### 3. `src/hooks/useAdminUserDetails.ts`
- Add a new `useAdminUserDonations` hook to fetch donor contributions when viewing a donor's profile

#### 4. Donor Contributions Tab
- Add a new "المنح" (Grants) tab that shows donor_contributions data when the user is a donor
- Display amount, project/service linkage, and donation status
