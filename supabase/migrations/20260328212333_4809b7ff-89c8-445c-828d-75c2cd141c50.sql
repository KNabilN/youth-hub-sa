
-- 1. Remove public INSERT policy on notifications (triggers handle inserts via SECURITY DEFINER)
DROP POLICY IF EXISTS "Authenticated users insert notifications" ON public.notifications;

-- 2. Restrict profile_saves SELECT to owner only (remove overly broad "Authenticated count saves")
DROP POLICY IF EXISTS "Authenticated count saves" ON public.profile_saves;
