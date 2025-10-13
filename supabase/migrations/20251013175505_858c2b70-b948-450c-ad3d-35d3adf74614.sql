-- Add new fields to bookings table to match the booking form requirements

ALTER TABLE public.bookings
ADD COLUMN booking_type text DEFAULT 'agent',
ADD COLUMN reference_email text,
ADD COLUMN customer_name text,
ADD COLUMN address text,
ADD COLUMN contact_no text,
ADD COLUMN email text,
ADD COLUMN include_booking boolean DEFAULT true,
ADD COLUMN include_delhi_manali boolean DEFAULT false,
ADD COLUMN include_manali_delhi boolean DEFAULT false,
ADD COLUMN include_safari boolean DEFAULT false,
ADD COLUMN include_another_hotel boolean DEFAULT false,
ADD COLUMN include_additional_vehicle boolean DEFAULT false,
ADD COLUMN include_group_expenses boolean DEFAULT false,
ADD COLUMN agent_commission numeric,
ADD COLUMN cheque_no text;

-- Add comment for clarity
COMMENT ON COLUMN public.bookings.booking_type IS 'Type of booking: agent or direct';
COMMENT ON COLUMN public.bookings.include_booking IS 'Whether to include hotel booking';
COMMENT ON COLUMN public.bookings.include_delhi_manali IS 'Whether to include Delhi-Manali Volvo';
COMMENT ON COLUMN public.bookings.include_manali_delhi IS 'Whether to include Manali-Delhi Volvo';
COMMENT ON COLUMN public.bookings.include_safari IS 'Whether to include Safari';
COMMENT ON COLUMN public.bookings.include_another_hotel IS 'Whether to include Another Hotel';
COMMENT ON COLUMN public.bookings.include_additional_vehicle IS 'Whether to include Additional Vehicle';
COMMENT ON COLUMN public.bookings.include_group_expenses IS 'Whether to include Group Expenses';