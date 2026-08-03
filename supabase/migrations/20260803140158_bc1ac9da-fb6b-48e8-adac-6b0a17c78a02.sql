CREATE TABLE public.visa_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  visa_name text NOT NULL,
  visa_date date NOT NULL,
  number_of_persons integer DEFAULT 1,
  rate_per_person numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  due_amount numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_bookings TO authenticated;
GRANT ALL ON public.visa_bookings TO service_role;

ALTER TABLE public.visa_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage visa bookings"
ON public.visa_bookings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE TRIGGER update_visa_bookings_updated_at
BEFORE UPDATE ON public.visa_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cruise_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  cruise_name text NOT NULL,
  cruise_date date NOT NULL,
  number_of_persons integer DEFAULT 1,
  rate_per_person numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  due_amount numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cruise_bookings TO authenticated;
GRANT ALL ON public.cruise_bookings TO service_role;

ALTER TABLE public.cruise_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cruise bookings"
ON public.cruise_bookings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE TRIGGER update_cruise_bookings_updated_at
BEFORE UPDATE ON public.cruise_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS include_visa boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS include_cruise boolean DEFAULT false;