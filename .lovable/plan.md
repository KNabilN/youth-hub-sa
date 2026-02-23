
# منصة الخدمات المشتركة — Shared Services Platform

## Overview
A Saudi governmental-grade digital marketplace connecting youth associations with service providers and donors. Arabic-only, RTL-first, built on Supabase with full RBAC, escrow logic, and audit trails.

---

## Stage 1: Foundation & Design System

### RTL Arabic Design System
- Configure Tailwind for full RTL support with `dir="rtl"` on the root element
- Set up Arabic typography using IBM Plex Sans Arabic
- Define the Saudi governmental color palette: Deep Green (primary/trust), Royal Gold/Sand (accents/heritage), Slate Gray (modern elements)
- Build reusable Arabic UI components (buttons, inputs, cards, badges) with RTL-aware spacing and alignment

### Authentication & RBAC
- Supabase Auth with email/password signup
- Four roles: Super Admin, Youth Association, Service Provider, Donor
- `user_roles` table with RLS policies using `has_role()` security definer function
- `profiles` table with organization details, verification status, and role-specific fields
- Role-based route protection and navigation

### App Shell & Navigation
- RTL sidebar navigation with role-specific menu items
- Role-based dashboard routing (each role sees their own landing page)
- Accessibility widget (text scaling, high-contrast mode)
- Global notification bell and user profile menu

---

## Stage 2: Core Database & Domain Models

### Database Tables
- **projects**: Title, description, required skills, estimated hours, status, association_id, assigned_provider_id
- **micro_services**: Provider-created fixed-price or hourly services with descriptions, pricing, categories
- **bids**: Provider proposals on projects with price, timeline, cover letter
- **contracts**: System-generated digital agreements linking project, association, and provider
- **time_logs**: Hourly work entries by providers, with approval status by associations
- **categories** and **regions**: Admin-managed lookup tables
- **disputes**: Multi-party dispute records with status and resolution
- **ratings**: Three-tier evaluation (quality, timing, communication)
- **audit_log**: Immutable record of all system changes

### Financial Tables
- **escrow_transactions**: Funds held, released, or frozen
- **invoices**: ZATCA-style electronic invoice records for platform commissions
- **commission_config**: Admin-configurable platform fee rates
- **donor_contributions**: Donations linked to specific projects or services

---

## Stage 3: Youth Association Features

### Project Lifecycle
- Multi-step project creation form (description, skills, hours, budget, privacy toggle)
- Project listing with status filters (draft, open, in-progress, completed, disputed)
- Provider selection from received bids with rating comparisons
- Digital contract signing flow

### Work Verification
- Review submitted time logs from providers
- Approve/reject individual hour entries
- View project health dashboard with active milestones and pending approvals

### Micro-Service Procurement
- Browse and filter marketplace catalog
- Direct purchase flow for fixed-price services
- Request donor funding for specific services

---

## Stage 4: Service Provider Features

### Professional Portfolio
- Profile builder with CV, hourly rate, skills, and service offerings
- Verification badge display for completed documentation
- Service listing creation (fixed-price or hourly, with descriptions and pricing)

### Project Bidding
- Browse open projects matching skills
- Submit proposals with price, timeline, and cover message
- Track bid status (pending, accepted, rejected)

### Work & Earnings
- Time tracking interface for logging hours on active projects
- Earnings dashboard: pending payments, completed payments, total profits
- Work calendar view showing active engagements

---

## Stage 5: Donor Features

### Strategic Philanthropy
- Browse associations and their project/service needs
- Allocate funding to specific projects or buy services on behalf of associations
- View association profiles with historical ratings

### Impact Reporting
- Real-time dashboard showing contribution allocations
- Visual charts (recharts) showing fund distribution and project outcomes
- Detailed reports on supported projects and their completion status

---

## Stage 6: Super Admin Features

### User Management
- User listing with search, filters, and bulk actions
- Account approval, suspension, and modification
- Role assignment interface

### Platform Oversight
- Review and approve micro-services and projects before they go live
- Commission rate configuration panel
- Financial reports with export to Excel

### Dispute Resolution
- Dispute queue with case details
- Payment freeze/release controls
- Mediation and final ruling interface

### Content & System
- Homepage content editor (images, text)
- Category and region management
- Full audit trail viewer with filters
- System performance reports

---

## Stage 7: System-Wide Features

### Notifications
- Real-time in-app notification system
- Email alerts for key events (contract signed, payment released, dispute opened)

### Internal Ticketing
- Support ticket creation and tracking for all users
- Admin ticket management queue

### Escrow & Payment Logic
- Fund collection simulation (payment gateway integration placeholder)
- Escrow hold/release workflow tied to project milestones and hour approvals
- Automated commission deduction engine
- Invoice generation for platform fees

### Accessibility
- Text enlargement controls
- High-contrast mode toggle
- Keyboard navigation support
- Simple, clear Arabic labels throughout

---

## Design Principles
- **Arabic-First**: All layouts designed natively for RTL, not mirrored from LTR
- **Professional Saudi Identity**: Deep green, gold, and gray palette with clean typography
- **Task-Oriented Dashboards**: Each role sees actionable items first, not generic listings
- **Mobile-First**: Thumb-friendly interactions, responsive from 360px up
- **Trust Indicators**: Verified badges, secure connection indicators, clear privacy links
