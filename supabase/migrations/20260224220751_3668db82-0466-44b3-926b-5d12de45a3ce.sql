
-- Allow users to delete their own notifications
CREATE POLICY "Users delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (user_id = auth.uid());
