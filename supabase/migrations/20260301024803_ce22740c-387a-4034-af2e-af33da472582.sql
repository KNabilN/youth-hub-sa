
-- Add new columns to micro_services
ALTER TABLE micro_services ADD COLUMN gallery jsonb DEFAULT '[]';
ALTER TABLE micro_services ADD COLUMN faq jsonb DEFAULT '[]';
ALTER TABLE micro_services ADD COLUMN packages jsonb DEFAULT '[]';
ALTER TABLE micro_services ADD COLUMN long_description text DEFAULT '';
ALTER TABLE micro_services ADD COLUMN service_views integer DEFAULT 0;
ALTER TABLE micro_services ADD COLUMN sales_count integer DEFAULT 0;

-- RPC to increment service views
CREATE OR REPLACE FUNCTION increment_service_views(s_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
  UPDATE micro_services 
  SET service_views = COALESCE(service_views, 0) + 1 
  WHERE id = s_id;
$$;

-- Trigger to auto-increment sales_count on escrow creation
CREATE OR REPLACE FUNCTION increment_service_sales()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.service_id IS NOT NULL THEN
    UPDATE micro_services 
    SET sales_count = COALESCE(sales_count, 0) + 1 
    WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_escrow_increment_sales
  AFTER INSERT ON escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION increment_service_sales();
