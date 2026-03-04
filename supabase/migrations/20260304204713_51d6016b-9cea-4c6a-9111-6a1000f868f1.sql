
-- 1. Create grant_requests table
CREATE TABLE public.grant_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  donor_id uuid DEFAULT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id uuid DEFAULT NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.grant_requests ENABLE ROW LEVEL SECURITY;

-- Associations manage own grant requests
CREATE POLICY "Associations manage own grant requests"
  ON public.grant_requests FOR ALL TO authenticated
  USING (association_id = auth.uid())
  WITH CHECK (association_id = auth.uid());

-- Donors view general + targeted grant requests
CREATE POLICY "Donors view grant requests"
  ON public.grant_requests FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'donor') AND
    (donor_id IS NULL OR donor_id = auth.uid()) AND
    status IN ('pending', 'approved')
  );

-- Admin manage all
CREATE POLICY "Admin manage all grant requests"
  ON public.grant_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 2. RPC to get verified donor IDs
CREATE OR REPLACE FUNCTION public.get_verified_donor_ids()
  RETURNS SETOF uuid
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT ur.user_id FROM user_roles ur
  JOIN profiles p ON p.id = ur.user_id
  WHERE ur.role = 'donor' AND p.is_verified = true;
$$;

-- 3. Notification trigger for grant requests
CREATE OR REPLACE FUNCTION public.notify_on_grant_request_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _assoc_name text;
  _donor_name text;
BEGIN
  SELECT full_name INTO _assoc_name FROM profiles WHERE id = NEW.association_id;

  IF TG_OP = 'INSERT' THEN
    -- If targeted to a specific donor, notify them
    IF NEW.donor_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.donor_id, 'طلب منحة جديد من ' || _assoc_name || ' بمبلغ ' || NEW.amount || ' ر.س', 'grant_request_received');
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify association on status change
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.association_id, 'تمت الموافقة على طلب المنحة بمبلغ ' || NEW.amount || ' ر.س', 'grant_request_approved');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.association_id, 'تم رفض طلب المنحة بمبلغ ' || NEW.amount || ' ر.س' || CASE WHEN NEW.admin_note <> '' THEN '. السبب: ' || NEW.admin_note ELSE '' END, 'grant_request_rejected');
    ELSIF NEW.status = 'funded' THEN
      INSERT INTO notifications (user_id, message, type)
      VALUES (NEW.association_id, 'تم تمويل طلب المنحة بمبلغ ' || NEW.amount || ' ر.س', 'grant_request_funded');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_grant_request
  AFTER INSERT OR UPDATE ON public.grant_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_grant_request_change();
