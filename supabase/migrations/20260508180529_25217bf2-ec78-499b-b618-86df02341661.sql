
ALTER TABLE public.edit_requests
  ADD COLUMN IF NOT EXISTS old_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_note text DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_edit_requests_target_status ON public.edit_requests(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_edit_requests_status_created ON public.edit_requests(status, created_at DESC);

DROP POLICY IF EXISTS "Users create own edit requests" ON public.edit_requests;
CREATE POLICY "Users create own edit requests"
ON public.edit_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND target_user_id = auth.uid()
  AND is_not_suspended(auth.uid())
);

CREATE OR REPLACE FUNCTION public.apply_edit_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  k text;
  v jsonb;
  sql text;
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT * INTO r FROM public.edit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;
  IF r.target_table <> 'profiles' THEN RAISE EXCEPTION 'unsupported table'; END IF;

  FOR k, v IN SELECT * FROM jsonb_each(r.requested_changes) LOOP
    IF k NOT IN (
      'full_name','organization_name','license_number',
      'contact_officer_name','contact_officer_email','contact_officer_phone','contact_officer_title',
      'region_id','city_id','bio'
    ) THEN
      CONTINUE;
    END IF;
    sql := format('UPDATE public.profiles SET %I = $1 WHERE id = $2', k);
    IF k IN ('region_id','city_id') THEN
      EXECUTE sql USING NULLIF(v #>> '{}', '')::uuid, r.target_user_id;
    ELSE
      EXECUTE sql USING (v #>> '{}'), r.target_user_id;
    END IF;
  END LOOP;

  UPDATE public.edit_requests
    SET status='approved', reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now()
    WHERE id = p_request_id;

  INSERT INTO public.notifications (user_id, type, message, entity_type, entity_id, delivery_status)
  VALUES (r.target_user_id, 'success', 'تمت الموافقة على تعديلات ملفك الشخصي', 'edit_request', p_request_id, 'sent');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_edit_request(p_request_id uuid, p_note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  SELECT * INTO r FROM public.edit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;

  UPDATE public.edit_requests
    SET status='rejected', reviewed_by=auth.uid(), reviewed_at=now(),
        admin_note=COALESCE(p_note,''), updated_at=now()
    WHERE id = p_request_id;

  INSERT INTO public.notifications (user_id, type, message, entity_type, entity_id, delivery_status)
  VALUES (r.target_user_id, 'warning',
          'تم رفض تعديلات ملفك الشخصي' || CASE WHEN COALESCE(p_note,'')<>'' THEN ': '||p_note ELSE '' END,
          'edit_request', p_request_id, 'sent');
END;
$$;
