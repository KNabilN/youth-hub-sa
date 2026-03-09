ALTER TABLE grant_requests
ADD COLUMN purpose text DEFAULT '',
ADD COLUMN target_group text DEFAULT '',
ADD COLUMN beneficiaries_count integer,
ADD COLUMN urgency text DEFAULT 'normal';