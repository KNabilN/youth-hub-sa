-- Add is_name_visible column to projects table (per-project control)
ALTER TABLE public.projects ADD COLUMN is_name_visible boolean NOT NULL DEFAULT true;

-- Update get_public_project to use project-level is_name_visible
CREATE OR REPLACE FUNCTION public.get_public_project(p_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', p.id,
    'title', p.title,
    'description', p.description,
    'status', p.status,
    'required_skills', p.required_skills,
    'created_at', p.created_at,
    'is_name_visible', p.is_name_visible,
    'category', (SELECT json_build_object('name', c.name) FROM categories c WHERE c.id = p.category_id),
    'region', (SELECT json_build_object('name', r.name) FROM regions r WHERE r.id = p.region_id),
    'association', (SELECT json_build_object(
      'full_name', pr.full_name,
      'organization_name', pr.organization_name,
      'avatar_url', pr.avatar_url
    ) FROM profiles pr WHERE pr.id = p.association_id)
  )
  FROM projects p
  WHERE p.id = p_id
    AND p.status <> 'draft'
    AND p.is_private = false;
$$;