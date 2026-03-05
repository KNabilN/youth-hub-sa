
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _role app_role;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'youth_association')::app_role;
  -- SECURITY: Prevent privilege escalation via signup
  IF _role = 'super_admin' THEN
    _role := 'youth_association';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;
