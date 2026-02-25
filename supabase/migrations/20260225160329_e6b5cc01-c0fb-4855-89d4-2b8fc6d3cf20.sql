
-- Table for user-suggested categories pending admin approval
CREATE TABLE public.pending_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  suggested_by UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'service', -- 'service' or 'project'
  entity_id UUID, -- optional: the service/project that used this
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.pending_categories ENABLE ROW LEVEL SECURITY;

-- Admin can manage all
CREATE POLICY "Admin manage pending categories"
  ON public.pending_categories FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Users can view own suggestions
CREATE POLICY "Users view own suggestions"
  ON public.pending_categories FOR SELECT
  USING (suggested_by = auth.uid());

-- Authenticated users can suggest
CREATE POLICY "Users can suggest categories"
  ON public.pending_categories FOR INSERT
  WITH CHECK (auth.uid() = suggested_by AND is_not_suspended(auth.uid()));
