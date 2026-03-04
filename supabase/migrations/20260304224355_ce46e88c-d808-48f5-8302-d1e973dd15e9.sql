
-- Create impact_reports table
create table public.impact_reports (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid references public.donor_contributions(id) on delete cascade,
  project_id uuid references public.projects(id),
  association_id uuid not null,
  donor_id uuid not null,
  title text not null default '',
  description text default '',
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

alter table public.impact_reports enable row level security;

-- RLS: Donors read their own reports
create policy "Donors view own impact reports"
on public.impact_reports for select
using (donor_id = auth.uid());

-- RLS: Associations manage their own reports
create policy "Associations manage own impact reports"
on public.impact_reports for all
using (association_id = auth.uid())
with check (association_id = auth.uid());

-- RLS: Admin manage all
create policy "Admin manage all impact reports"
on public.impact_reports for all
using (public.has_role(auth.uid(), 'super_admin'))
with check (public.has_role(auth.uid(), 'super_admin'));

-- Storage bucket for impact report PDFs
insert into storage.buckets (id, name, public)
values ('impact-reports', 'impact-reports', false);

-- Storage RLS: Associations upload
create policy "Associations upload impact reports"
on storage.objects for insert
with check (bucket_id = 'impact-reports' and auth.uid() is not null);

-- Storage RLS: Authenticated users can read
create policy "Authenticated read impact reports"
on storage.objects for select
using (bucket_id = 'impact-reports' and auth.uid() is not null);

-- Storage RLS: Owners can delete
create policy "Owners delete impact reports"
on storage.objects for delete
using (bucket_id = 'impact-reports' and (storage.foldername(name))[1] = auth.uid()::text);
