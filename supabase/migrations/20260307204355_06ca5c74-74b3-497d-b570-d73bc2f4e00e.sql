
-- Update trigger to use anon key (edge function has verify_jwt=false and uses service_role internally)
CREATE OR REPLACE FUNCTION public.send_notification_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call edge function asynchronously via pg_net using anon key
  PERFORM extensions.http_post(
    url := 'https://nuneqhhampikooviiphf.supabase.co/functions/v1/send-notification-email',
    body := jsonb_build_object('notification_id', NEW.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51bmVxaGhhbXBpa29vdmlpcGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MzUzNDksImV4cCI6MjA4NzQxMTM0OX0._jeWF_ze3HbbDbg4OlXPAKVO7C7eZO9nKSlAyRRThLg'
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'send_notification_email_trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$;
