
-- 1. Create get_public_profile() SECURITY DEFINER function (returns only safe fields)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'bio', p.bio,
    'cover_image_url', p.cover_image_url,
    'company_logo_url', p.company_logo_url,
    'organization_name', p.organization_name,
    'skills', p.skills,
    'qualifications', p.qualifications,
    'hourly_rate', p.hourly_rate,
    'is_verified', p.is_verified,
    'profile_views', p.profile_views
  )
  FROM profiles p
  WHERE p.id = p_id
    AND (
      EXISTS (SELECT 1 FROM micro_services ms WHERE ms.provider_id = p.id AND ms.approval = 'approved')
      OR EXISTS (SELECT 1 FROM projects pr WHERE pr.association_id = p.id AND pr.status <> 'draft' AND pr.is_private = false)
    );
$$;

-- 2. Create get_public_project() SECURITY DEFINER function (excludes budget/hours/association_id)
CREATE OR REPLACE FUNCTION public.get_public_project(p_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', p.id,
    'title', p.title,
    'description', p.description,
    'status', p.status,
    'required_skills', p.required_skills,
    'created_at', p.created_at,
    'category', (SELECT json_build_object('name', c.name) FROM categories c WHERE c.id = p.category_id),
    'region', (SELECT json_build_object('name', r.name) FROM regions r WHERE r.id = p.region_id),
    'association', (SELECT json_build_object(
      'full_name', pr.full_name,
      'organization_name', pr.organization_name,
      'avatar_url', pr.avatar_url,
      'is_name_visible', pr.is_name_visible
    ) FROM profiles pr WHERE pr.id = p.association_id)
  )
  FROM projects p
  WHERE p.id = p_id
    AND p.status <> 'draft'
    AND p.is_private = false;
$$;

-- 3. Restrict profile_saves: change "Public count saves" to require auth
DROP POLICY IF EXISTS "Public count saves" ON public.profile_saves;
CREATE POLICY "Authenticated count saves" ON public.profile_saves
  FOR SELECT TO authenticated
  USING (true);
