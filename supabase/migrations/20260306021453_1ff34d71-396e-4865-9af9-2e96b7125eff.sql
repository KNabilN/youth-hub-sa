
-- Clean up existing duplicate notifications
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, message, type, DATE_TRUNC('second', created_at)
    ORDER BY created_at
  ) AS rn
  FROM public.notifications
)
DELETE FROM public.notifications
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
