-- Add total_quantity column to rooms table for tracking total available rooms of each type
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS total_quantity integer NOT NULL DEFAULT 1;

-- Update room_number to be used as room_name (rename conceptually, no schema change needed)
-- The room_number field will now store the room name like "Presidential Suite", "Cottage Room", etc.