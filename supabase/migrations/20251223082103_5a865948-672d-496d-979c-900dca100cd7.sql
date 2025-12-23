-- Add booking_id column to restaurant_orders for linking food orders to hotel bookings
ALTER TABLE public.restaurant_orders 
ADD COLUMN booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_restaurant_orders_booking_id ON public.restaurant_orders(booking_id);