
-- Create function to return landing page stats securely
CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'providers', (SELECT count(*) FROM user_roles WHERE role = 'service_provider'),
    'associations', (SELECT count(*) FROM user_roles WHERE role = 'youth_association'),
    'completed_projects', (SELECT count(*) FROM projects WHERE status = 'completed'),
    'approved_services', (SELECT count(*) FROM micro_services WHERE approval = 'approved')
  );
$$;

-- Add RLS policy for public to browse open non-private projects (for landing page)
CREATE POLICY "Public browse open projects"
ON public.projects
FOR SELECT
USING (status = 'open' AND is_private = false AND auth.uid() IS NULL);
