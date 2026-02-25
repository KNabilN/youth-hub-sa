-- Allow associations to update bid status on their own projects
CREATE POLICY "Associations update bids on own projects"
  ON public.bids
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = bids.project_id
      AND projects.association_id = auth.uid()
    )
  );
