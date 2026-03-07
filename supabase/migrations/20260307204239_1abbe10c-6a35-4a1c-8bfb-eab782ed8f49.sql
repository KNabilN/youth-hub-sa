
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Function to call edge function on new notification
CREATE OR REPLACE FUNCTION public.send_notification_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _supabase_url text;
  _service_role_key text;
BEGIN
  -- Get config from vault/env
  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);

  -- Fallback: use direct URL if app settings not available
  IF _supabase_url IS NULL OR _supabase_url = '' THEN
    _supabase_url := 'https://nuneqhhampikooviiphf.supabase.co';
  END IF;

  IF _service_role_key IS NULL OR _service_role_key = '' THEN
    -- Cannot send without service role key, skip silently
    RETURN NEW;
  END IF;

  -- Call edge function asynchronously via pg_net
  PERFORM extensions.http_post(
    url := _supabase_url || '/functions/v1/send-notification-email',
    body := jsonb_build_object('notification_id', NEW.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_role_key
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block notification insert if email fails
    RAISE WARNING 'send_notification_email_trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS trg_send_notification_email ON public.notifications;
CREATE TRIGGER trg_send_notification_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_notification_email_trigger();
