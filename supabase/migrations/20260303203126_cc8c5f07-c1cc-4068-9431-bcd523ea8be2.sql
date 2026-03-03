CREATE OR REPLACE FUNCTION public.get_verified_association_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id FROM user_roles ur
  JOIN profiles p ON p.id = ur.user_id
  WHERE ur.role = 'youth_association' AND p.is_verified = true;
$$;