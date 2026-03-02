
-- Create ticket_replies table
CREATE TABLE public.ticket_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin manage all ticket replies"
ON public.ticket_replies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Ticket owner can read replies on their tickets
CREATE POLICY "Ticket owner read replies"
ON public.ticket_replies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_replies.ticket_id
    AND st.user_id = auth.uid()
  )
);

-- Ticket owner can insert replies (if not suspended)
CREATE POLICY "Ticket owner insert replies"
ON public.ticket_replies
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND public.is_not_suspended(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_replies.ticket_id
    AND st.user_id = auth.uid()
  )
);
