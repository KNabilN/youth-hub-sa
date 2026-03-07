
-- 1. Enable realtime for contracts, time_logs, invoices, escrow_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_transactions;

-- 2. Update timelog trigger function to also notify on INSERT (new hours logged)
CREATE OR REPLACE FUNCTION public.notify_on_timelog_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _project_title text;
  _assoc_id uuid;
  _provider_name text;
BEGIN
  -- On INSERT: notify association that provider logged new hours
  IF TG_OP = 'INSERT' THEN
    SELECT title, association_id INTO _project_title, _assoc_id FROM projects WHERE id = NEW.project_id;
    SELECT full_name INTO _provider_name FROM profiles WHERE id = NEW.provider_id;
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (_assoc_id, 'قام ' || _provider_name || ' بتسجيل ' || NEW.hours || ' ساعة عمل في مشروع "' || _project_title || '"', 'timelog_submitted', NEW.project_id, 'project');
    RETURN NEW;
  END IF;

  -- On UPDATE: notify provider about approval/rejection
  IF OLD.approval IS DISTINCT FROM NEW.approval AND NEW.approval IN ('approved', 'rejected') THEN
    SELECT title INTO _project_title FROM projects WHERE id = NEW.project_id;
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (NEW.provider_id,
      CASE NEW.approval
        WHEN 'approved' THEN 'تمت الموافقة على سجل الوقت الخاص بك في مشروع "' || _project_title || '"'
        WHEN 'rejected' THEN 'تم رفض سجل الوقت الخاص بك في مشروع "' || _project_title || '"' || CASE WHEN NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason <> '' THEN '. السبب: ' || NEW.rejection_reason ELSE '' END
      END,
      'timelog_' || NEW.approval, NEW.project_id, 'project');
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Drop old trigger and recreate to fire on INSERT OR UPDATE
DROP TRIGGER IF EXISTS trg_notify_timelog_approval ON public.time_logs;
CREATE TRIGGER trg_notify_timelog_approval
  AFTER INSERT OR UPDATE ON public.time_logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_timelog_approval();
