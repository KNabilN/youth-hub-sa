CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, license_number, organization_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'license_number', '')), ''),
    COALESCE(NEW.raw_user_meta_data->>'organization_name', '')
  );
  RETURN NEW;
END;
$function$;