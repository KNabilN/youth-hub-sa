
-- Add new values to approval_status enum (for services)
ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'archived';

-- Add new values to project_status enum (for projects)
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'archived';
