CREATE OR REPLACE FUNCTION public.get_user_email_admin(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT email FROM auth.users WHERE id = p_user_id;
$$;