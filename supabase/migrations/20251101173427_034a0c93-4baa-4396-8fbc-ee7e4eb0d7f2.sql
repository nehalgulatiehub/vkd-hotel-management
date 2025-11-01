-- Add own_hotel_id column to hotel_bookings to support both own hotels and another hotels
ALTER TABLE public.hotel_bookings 
ADD COLUMN own_hotel_id UUID REFERENCES public.own_hotels(id);

-- Make the existing hotel_id nullable since we'll use either hotel_id OR own_hotel_id
ALTER TABLE public.hotel_bookings 
ALTER COLUMN hotel_id DROP NOT NULL;

-- Add a check constraint to ensure either hotel_id or own_hotel_id is set, but not both
ALTER TABLE public.hotel_bookings 
ADD CONSTRAINT hotel_bookings_hotel_check 
CHECK (
  (hotel_id IS NOT NULL AND own_hotel_id IS NULL) OR 
  (hotel_id IS NULL AND own_hotel_id IS NOT NULL)
);

-- Add comment explaining the structure
COMMENT ON TABLE public.hotel_bookings IS 'Stores hotel bookings for both own hotels (own_hotel_id) and partner hotels (hotel_id). Exactly one of these fields must be set.';