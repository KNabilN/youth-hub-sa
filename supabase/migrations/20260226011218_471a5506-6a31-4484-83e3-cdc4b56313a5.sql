-- Update public browse policy to allow viewing all non-draft, non-private projects
DROP POLICY IF EXISTS "Public browse open projects" ON public.projects;

CREATE POLICY "Public browse non-draft projects"
ON public.projects
FOR SELECT
USING (
  (status <> 'draft'::project_status)
  AND (is_private = false)
  AND (auth.uid() IS NULL)
);