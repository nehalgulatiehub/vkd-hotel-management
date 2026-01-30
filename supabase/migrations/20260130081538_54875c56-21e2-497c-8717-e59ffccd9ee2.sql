-- Backfill existing agents with vikender's user id
UPDATE public.agents 
SET created_by = '417cfa83-10f4-41c0-ad00-4e3bb45d788a' 
WHERE created_by IS NULL;