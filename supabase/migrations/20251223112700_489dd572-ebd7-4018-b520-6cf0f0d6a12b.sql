-- Add city_id (place where payment was collected) and payment_type columns to payments table
ALTER TABLE public.payments 
ADD COLUMN city_id uuid REFERENCES public.cities(id),
ADD COLUMN payment_type text;