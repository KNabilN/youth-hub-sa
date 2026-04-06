ALTER TABLE projects DROP CONSTRAINT projects_category_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE micro_services DROP CONSTRAINT micro_services_category_id_fkey;
ALTER TABLE micro_services ADD CONSTRAINT micro_services_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;