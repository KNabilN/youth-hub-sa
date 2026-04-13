
-- Create a secure RPC function for sending notifications
-- This bypasses the restrictive INSERT policy while providing validation
CREATE OR REPLACE FUNCTION public.send_notification_secure(
  _recipient_id uuid,
  _message text,
  _type text DEFAULT 'info',
  _entity_id uuid DEFAULT NULL,
  _entity_type text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate caller is authenticated and not suspended
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_not_suspended(auth.uid()) THEN
    RAISE EXCEPTION 'Account is suspended';
  END IF;

  -- Validate recipient exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = _recipient_id) THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  INSERT INTO notifications (user_id, message, type, entity_id, entity_type)
  VALUES (_recipient_id, _message, _type, _entity_id, _entity_type);
END;
$$;
