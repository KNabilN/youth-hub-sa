-- Step 1: clear license_number from duplicate (newer) rows, keeping the earliest per license_number
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY license_number ORDER BY created_at ASC) AS rn
  FROM public.profiles
  WHERE license_number IS NOT NULL AND btrim(license_number) <> ''
)
UPDATE public.profiles p
SET license_number = ''
FROM ranked r
WHERE p.id = r.id AND r.rn > 1;

-- Step 2: unique partial index (ignores empty/null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_license_number_unique
ON public.profiles (license_number)
WHERE license_number IS NOT NULL AND btrim(license_number) <> '';

-- Step 3: check function
CREATE OR REPLACE FUNCTION public.check_license_number_exists(p_license text, p_exclude_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE license_number IS NOT NULL
      AND btrim(license_number) <> ''
      AND btrim(lower(license_number)) = btrim(lower(p_license))
      AND (p_exclude_user_id IS NULL OR id <> p_exclude_user_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_license_number_exists(text, uuid) TO anon, authenticated;