-- Add room_number column to restaurant_orders
ALTER TABLE public.restaurant_orders 
ADD COLUMN room_number text;