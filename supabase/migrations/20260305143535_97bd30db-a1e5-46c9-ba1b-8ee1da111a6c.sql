ALTER TABLE micro_services ALTER COLUMN display_order SET DEFAULT 999;
UPDATE micro_services SET display_order = 999 WHERE display_order = 0;