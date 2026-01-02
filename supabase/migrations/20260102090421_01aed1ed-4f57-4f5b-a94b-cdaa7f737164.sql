-- Create room_blocks table to track blocked/unavailable rooms
CREATE TABLE public.room_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  blocked_quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, block_date)
);

-- Enable RLS
ALTER TABLE public.room_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view room blocks"
ON public.room_blocks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert room blocks"
ON public.room_blocks
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update room blocks"
ON public.room_blocks
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete room blocks"
ON public.room_blocks
FOR DELETE
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_room_blocks_updated_at
BEFORE UPDATE ON public.room_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_room_blocks_room_date ON public.room_blocks(room_id, block_date);