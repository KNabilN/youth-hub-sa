
-- Allow authenticated users to read all roles (roles are non-sensitive public info)
CREATE POLICY "Authenticated users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);
