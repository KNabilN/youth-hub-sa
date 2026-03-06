-- Clean up duplicate audit log entries
DELETE FROM audit_log WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY table_name, record_id, action, created_at,
        (new_values::text), (old_values::text)
      ORDER BY id
    ) AS rn
    FROM audit_log
  ) sub WHERE rn > 1
);