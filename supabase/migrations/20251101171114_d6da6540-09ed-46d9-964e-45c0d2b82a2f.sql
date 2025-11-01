-- Create own_hotels table for the user's hotels
CREATE TABLE IF NOT EXISTS public.own_hotels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city_id UUID REFERENCES public.cities(id),
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  rating NUMERIC,
  description TEXT,
  amenities TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rooms table for own hotels
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.own_hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL, -- standard, deluxe, suite, etc.
  floor_number INTEGER,
  capacity INTEGER DEFAULT 2,
  adult_capacity INTEGER DEFAULT 2,
  child_capacity INTEGER DEFAULT 1,
  base_price NUMERIC NOT NULL DEFAULT 0,
  amenities TEXT[],
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(hotel_id, room_number)
);

-- Enable RLS
ALTER TABLE public.own_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for own_hotels
CREATE POLICY "Authenticated users can view own hotels" 
ON public.own_hotels 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage own hotels" 
ON public.own_hotels 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create policies for rooms
CREATE POLICY "Authenticated users can view rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage rooms" 
ON public.rooms 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_own_hotels_updated_at
BEFORE UPDATE ON public.own_hotels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some Indian cities if cities table is empty
INSERT INTO public.cities (name, state, country) VALUES
('Mumbai', 'Maharashtra', 'India'),
('Delhi', 'Delhi', 'India'),
('Bangalore', 'Karnataka', 'India'),
('Hyderabad', 'Telangana', 'India'),
('Chennai', 'Tamil Nadu', 'India'),
('Kolkata', 'West Bengal', 'India'),
('Pune', 'Maharashtra', 'India'),
('Ahmedabad', 'Gujarat', 'India'),
('Jaipur', 'Rajasthan', 'India'),
('Manali', 'Himachal Pradesh', 'India'),
('Shimla', 'Himachal Pradesh', 'India'),
('Goa', 'Goa', 'India'),
('Udaipur', 'Rajasthan', 'India'),
('Agra', 'Uttar Pradesh', 'India'),
('Varanasi', 'Uttar Pradesh', 'India')
ON CONFLICT DO NOTHING;

-- Comment on tables
COMMENT ON TABLE public.own_hotels IS 'Hotels owned/managed by the business';
COMMENT ON TABLE public.rooms IS 'Rooms in own hotels';
COMMENT ON TABLE public.another_hotels IS 'External/partner hotels not owned by the business';