
-- Create discount_codes table
CREATE TABLE public.discount_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  max_uses integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create discount_code_usages table
CREATE TABLE public.discount_code_usages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  escrow_id uuid REFERENCES public.escrow_transactions(id),
  project_id uuid REFERENCES public.projects(id),
  service_id uuid REFERENCES public.micro_services(id),
  discount_amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_code_usages ENABLE ROW LEVEL SECURITY;

-- Admin full access on discount_codes
CREATE POLICY "Admin manage discount codes"
ON public.discount_codes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Authenticated users can read active codes
CREATE POLICY "Authenticated read active discount codes"
ON public.discount_codes FOR SELECT TO authenticated
USING (is_active = true AND start_date <= current_date AND end_date >= current_date);

-- Admin full access on usages
CREATE POLICY "Admin manage discount code usages"
ON public.discount_code_usages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Users can insert their own usage
CREATE POLICY "Users insert own discount usage"
ON public.discount_code_usages FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can view their own usages
CREATE POLICY "Users view own discount usage"
ON public.discount_code_usages FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Index for fast code lookup
CREATE INDEX idx_discount_codes_code ON public.discount_codes (code);
CREATE INDEX idx_discount_code_usages_code_id ON public.discount_code_usages (code_id);
