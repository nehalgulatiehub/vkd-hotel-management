-- Add transporter_id column to payments table for direct safari/vehicle payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transporter_id uuid REFERENCES public.transporters(id);

-- Add hotel_id column to payments table for direct hotel payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.another_hotels(id);