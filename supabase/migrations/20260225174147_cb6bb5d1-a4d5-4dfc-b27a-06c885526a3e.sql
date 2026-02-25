
-- السماح للجمعيات بانشاء عقود
CREATE POLICY "Associations can create contracts"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (association_id = auth.uid());

-- السماح لاطراف العقد بتحديثه (التوقيع)
CREATE POLICY "Contract parties can update"
  ON public.contracts FOR UPDATE TO authenticated
  USING (association_id = auth.uid() OR provider_id = auth.uid());
