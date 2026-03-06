-- Remove duplicate audit trigger (audit_projects duplicates trg_audit_projects)
DROP TRIGGER IF EXISTS audit_projects ON public.projects;

-- Remove duplicate notification trigger (trg_notify_project_status duplicates trg_notify_on_project_status_change)
DROP TRIGGER IF EXISTS trg_notify_project_status ON public.projects;