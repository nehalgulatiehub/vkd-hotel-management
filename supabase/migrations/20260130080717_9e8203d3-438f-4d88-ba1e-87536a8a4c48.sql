-- Add created_by column to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_agents_created_by ON public.agents(created_by);