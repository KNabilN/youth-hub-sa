ALTER TABLE micro_services ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN is_featured boolean NOT NULL DEFAULT false;