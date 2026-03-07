
-- Create bid_comments table
CREATE TABLE public.bid_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id uuid NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bid_comments ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin manage all bid comments"
  ON public.bid_comments FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- SELECT: association (project owner) + provider (bid owner)
CREATE POLICY "Bid parties view comments"
  ON public.bid_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bids b
      JOIN projects p ON p.id = b.project_id
      WHERE b.id = bid_comments.bid_id
        AND (b.provider_id = auth.uid() OR p.association_id = auth.uid())
    )
  );

-- INSERT: same parties, bid must be pending, user not suspended
CREATE POLICY "Bid parties insert comments"
  ON public.bid_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_not_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM bids b
      JOIN projects p ON p.id = b.project_id
      WHERE b.id = bid_comments.bid_id
        AND b.status = 'pending'
        AND (b.provider_id = auth.uid() OR p.association_id = auth.uid())
    )
  );

-- Notification trigger
CREATE OR REPLACE FUNCTION public.notify_on_bid_comment()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _provider_id uuid;
  _assoc_id uuid;
  _project_title text;
  _sender_name text;
  _recipient_id uuid;
BEGIN
  SELECT b.provider_id, p.association_id, p.title
  INTO _provider_id, _assoc_id, _project_title
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
    VALUES (_recipient_id, 'تعليق جديد من ' || _sender_name || ' على عرض في مشروع "' || _project_title || '"', 'bid_comment', NEW.bid_id, 'bid');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_bid_comment
  AFTER INSERT ON public.bid_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_bid_comment();
