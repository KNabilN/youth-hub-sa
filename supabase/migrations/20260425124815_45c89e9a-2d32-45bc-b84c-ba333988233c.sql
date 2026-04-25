
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS category text;

CREATE OR REPLACE FUNCTION public.notify_attachment_uploaded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id uuid;
  proj_id uuid;
  proj_title text;
  cat_label text;
BEGIN
  IF NEW.entity_type = 'project' THEN
    SELECT
      CASE WHEN p.association_id = NEW.user_id THEN p.assigned_provider_id ELSE p.association_id END,
      p.id, p.title
      INTO recipient_id, proj_id, proj_title
    FROM public.projects p WHERE p.id = NEW.entity_id;
  ELSIF NEW.entity_type = 'contract' THEN
    SELECT
      CASE WHEN c.association_id = NEW.user_id THEN c.provider_id ELSE c.association_id END,
      c.project_id, p.title
      INTO recipient_id, proj_id, proj_title
    FROM public.contracts c
    LEFT JOIN public.projects p ON p.id = c.project_id
    WHERE c.id = NEW.entity_id;
  ELSE
    RETURN NEW;
  END IF;

  IF recipient_id IS NULL OR recipient_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  cat_label := COALESCE(
    CASE NEW.category
      WHEN 'brand_identity' THEN 'هوية بصرية'
      WHEN 'content' THEN 'محتوى'
      WHEN 'operational' THEN 'مرفق تشغيلي'
      ELSE NULL
    END, 'مرفق');

  INSERT INTO public.notifications (user_id, type, message, entity_type, entity_id)
  VALUES (
    recipient_id,
    'attachment_uploaded',
    'تم رفع ' || cat_label || ' جديد على الطلب: ' || COALESCE(proj_title, ''),
    'project',
    proj_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_attachment_uploaded ON public.attachments;
CREATE TRIGGER trg_notify_attachment_uploaded
AFTER INSERT ON public.attachments
FOR EACH ROW
EXECUTE FUNCTION public.notify_attachment_uploaded();
