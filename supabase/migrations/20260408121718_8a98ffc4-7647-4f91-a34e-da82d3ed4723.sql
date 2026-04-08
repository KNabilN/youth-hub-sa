ALTER TABLE discount_code_usages 
ADD CONSTRAINT discount_code_usages_unique_per_user 
UNIQUE (code_id, user_id, created_at);