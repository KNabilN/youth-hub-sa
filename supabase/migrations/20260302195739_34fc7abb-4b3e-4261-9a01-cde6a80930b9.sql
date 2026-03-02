
-- تحديث سياسة RLS لعرض المرفقات لتشمل bid و service
DROP POLICY IF EXISTS "Users view related attachments" ON attachments;
CREATE POLICY "Users view related attachments" ON attachments FOR SELECT TO authenticated
USING (
  (user_id = auth.uid())
  OR (entity_type = 'project' AND EXISTS (SELECT 1 FROM projects p WHERE p.id = attachments.entity_id AND (p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())))
  OR (entity_type = 'contract' AND EXISTS (SELECT 1 FROM contracts c WHERE c.id = attachments.entity_id AND (c.association_id = auth.uid() OR c.provider_id = auth.uid())))
  OR (entity_type = 'ticket' AND EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = attachments.entity_id AND t.user_id = auth.uid()))
  OR (entity_type = 'dispute' AND EXISTS (SELECT 1 FROM disputes d JOIN projects p ON p.id = d.project_id WHERE d.id = attachments.entity_id AND (d.raised_by = auth.uid() OR p.association_id = auth.uid() OR p.assigned_provider_id = auth.uid())))
  OR (entity_type = 'bid' AND EXISTS (SELECT 1 FROM bids b JOIN projects p ON p.id = b.project_id WHERE b.id = attachments.entity_id AND (b.provider_id = auth.uid() OR p.association_id = auth.uid())))
  OR (entity_type = 'service' AND EXISTS (SELECT 1 FROM micro_services ms WHERE ms.id = attachments.entity_id AND ms.provider_id = auth.uid()))
);
