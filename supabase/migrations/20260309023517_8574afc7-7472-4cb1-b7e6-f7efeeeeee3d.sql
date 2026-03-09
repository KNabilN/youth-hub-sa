
-- Add rejection_reason to projects and micro_services
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.micro_services ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add 'rejected' to project_status enum
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'rejected';

-- Update notification trigger to include rejection reason for projects
CREATE OR REPLACE FUNCTION public.notify_on_project_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (NEW.association_id,
      CASE NEW.status
        WHEN 'open' THEN 'تمت الموافقة على مشروعك "' || NEW.title || '" وهو الآن مفتوح للعروض'
        WHEN 'in_progress' THEN 'بدأ العمل على مشروع "' || NEW.title || '"'
        WHEN 'completed' THEN 'تم إكمال مشروع "' || NEW.title || '" بنجاح'
        WHEN 'cancelled' THEN 'تم إلغاء مشروع "' || NEW.title || '"'
        WHEN 'disputed' THEN 'تم فتح نزاع على مشروع "' || NEW.title || '"'
        WHEN 'suspended' THEN 'تم تعليق مشروع "' || NEW.title || '"'
        WHEN 'rejected' THEN 'تم رفض مشروعك "' || NEW.title || '"' || CASE WHEN NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason <> '' THEN '. السبب: ' || NEW.rejection_reason ELSE '' END
        ELSE 'تم تحديث حالة مشروع "' || NEW.title || '"'
      END,
      'project_' || NEW.status, NEW.id, 'project');

    IF NEW.assigned_provider_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.assigned_provider_id,
        CASE NEW.status
          WHEN 'in_progress' THEN 'تم تعيينك على مشروع "' || NEW.title || '"'
          WHEN 'completed' THEN 'تم إكمال مشروع "' || NEW.title || '" بنجاح'
          WHEN 'cancelled' THEN 'تم إلغاء مشروع "' || NEW.title || '"'
          WHEN 'disputed' THEN 'تم فتح نزاع على مشروع "' || NEW.title || '"'
          ELSE 'تم تحديث حالة مشروع "' || NEW.title || '"'
        END,
        'project_' || NEW.status, NEW.id, 'project');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update service approval notification to include rejection reason
CREATE OR REPLACE FUNCTION public.notify_on_service_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.approval IS DISTINCT FROM NEW.approval THEN
    IF NEW.approval = 'approved' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تمت الموافقة على خدمتك "' || NEW.title || '" وهي الآن منشورة في السوق', 'service_approved', NEW.id, 'service');
    ELSIF NEW.approval = 'rejected' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تم رفض خدمتك "' || NEW.title || '"' || CASE WHEN NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason <> '' THEN '. السبب: ' || NEW.rejection_reason ELSE '' END, 'service_rejected', NEW.id, 'service');
    ELSIF NEW.approval = 'suspended' THEN
      INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
      VALUES (NEW.provider_id, 'تم تعليق خدمتك "' || NEW.title || '"', 'service_suspended', NEW.id, 'service');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
