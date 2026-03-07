CREATE OR REPLACE FUNCTION public.notify_on_bid_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _provider_id uuid;
  _assoc_id uuid;
  _project_id uuid;
  _project_title text;
  _sender_name text;
  _recipient_id uuid;
BEGIN
  SELECT b.provider_id, b.project_id, p.association_id, p.title
  INTO _provider_id, _project_id, _assoc_id, _project_title
  FROM bids b JOIN projects p ON p.id = b.project_id
  WHERE b.id = NEW.bid_id;

  SELECT full_name INTO _sender_name FROM profiles WHERE id = NEW.author_id;

  IF NEW.author_id = _provider_id THEN
    _recipient_id := _assoc_id;
  ELSE
    _recipient_id := _provider_id;
  END IF;

  IF _recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
    VALUES (_recipient_id, 'تعليق جديد من ' || _sender_name || ' على عرض في مشروع "' || _project_title || '"', 'bid_comment', _project_id, 'project');
  END IF;

  RETURN NEW;
END;
$function$;