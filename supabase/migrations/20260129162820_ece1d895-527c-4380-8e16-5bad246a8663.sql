-- Add missing columns used by the UI
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS state text;

ALTER TABLE public.transporters
ADD COLUMN IF NOT EXISTS state text;

-- Add fields requested for 'Another Hotel' (Partner hotels)
ALTER TABLE public.another_hotels
ADD COLUMN IF NOT EXISTS room_types text,
ADD COLUMN IF NOT EXISTS packages text,
ADD COLUMN IF NOT EXISTS website_url text;