
-- Block suspended users from performing write operations on key tables
-- We create a helper function to check if user is NOT suspended

CREATE OR REPLACE FUNCTION public.is_not_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT NOT COALESCE(
    (SELECT is_suspended FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

-- Add suspension check to projects INSERT
CREATE POLICY "Block suspended users from creating projects"
ON public.projects
FOR INSERT
WITH CHECK (is_not_suspended(auth.uid()));

-- Add suspension check to bids INSERT
CREATE POLICY "Block suspended users from creating bids"
ON public.bids
FOR INSERT
WITH CHECK (is_not_suspended(auth.uid()));

-- Add suspension check to micro_services INSERT
CREATE POLICY "Block suspended users from creating services"
ON public.micro_services
FOR INSERT
WITH CHECK (is_not_suspended(auth.uid()));

-- Add suspension check to disputes INSERT
CREATE POLICY "Block suspended users from creating disputes"
ON public.disputes
FOR INSERT
WITH CHECK (is_not_suspended(auth.uid()));

-- Add suspension check to time_logs INSERT
CREATE POLICY "Block suspended users from logging time"
ON public.time_logs
FOR INSERT
WITH CHECK (is_not_suspended(auth.uid()));

-- Add suspension check to dispute_responses INSERT
CREATE POLICY "Block suspended users from responding to disputes"
ON public.dispute_responses
FOR INSERT
WITH CHECK (is_not_suspended(auth.uid()));
