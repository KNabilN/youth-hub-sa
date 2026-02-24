
-- Create edit_requests table
CREATE TABLE public.edit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  target_user_id uuid NOT NULL,
  requested_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.edit_requests ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin manage all edit requests"
ON public.edit_requests FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Target users can view their own requests
CREATE POLICY "Users view own edit requests"
ON public.edit_requests FOR SELECT
TO authenticated
USING (target_user_id = auth.uid());

-- Target users can update their own requests (accept/reject)
CREATE POLICY "Users update own edit requests"
ON public.edit_requests FOR UPDATE
TO authenticated
USING (target_user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.edit_requests;
