CREATE OR REPLACE FUNCTION public.notify_admin_direct_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_sender_admin boolean;
  admin_id uuid;
BEGIN
  is_sender_admin := has_role(NEW.sender_id, 'super_admin'::app_role);

  IF is_sender_admin THEN
    PERFORM send_notification_secure(
      _recipient_id := NEW.user_id,
      _message      := 'لديك رسالة جديدة من الإدارة',
      _type         := 'admin_message',
      _entity_id    := NEW.id,
      _entity_type  := 'admin_message'
    );
  ELSE
    FOR admin_id IN
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'super_admin'::app_role
    LOOP
      PERFORM send_notification_secure(
        _recipient_id := admin_id,
        _message      := 'رد جديد من المستخدم على محادثة إدارية',
        _type         := 'admin_message_reply',
        _entity_id    := NEW.id,
        _entity_type  := 'admin_message'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;