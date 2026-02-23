
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own withdrawals" ON public.withdrawal_requests
  FOR ALL USING (provider_id = auth.uid());

CREATE POLICY "Admin manage withdrawals" ON public.withdrawal_requests
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
