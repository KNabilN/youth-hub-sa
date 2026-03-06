CREATE OR REPLACE FUNCTION public.get_public_profile(p_id uuid)
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
      OR EXISTS (SELECT 1 FROM bids b WHERE b.provider_id = p.id AND b.deleted_at IS NULL)
      OR EXISTS (SELECT 1 FROM contracts c WHERE c.provider_id = p.id OR c.association_id = p.id)
    );
$$;