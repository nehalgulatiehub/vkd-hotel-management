-- Drop existing tables and recreate schema for new system
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS housekeeping_tasks CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_types CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS properties CASCADE;

DROP TYPE IF EXISTS room_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS housekeeping_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;

-- Create new enums
CREATE TYPE booking_status AS ENUM ('enquiry', 'hold', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded');
CREATE TYPE vehicle_type AS ENUM ('bus', 'car', 'tempo_traveller', 'other');

-- Cities table
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  state TEXT,
  country TEXT DEFAULT 'India',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city_id UUID REFERENCES cities(id),
  commission_rate NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transporters table
CREATE TABLE transporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city_id UUID REFERENCES cities(id),
  vehicle_types TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Another Hotels (Third-party hotels)
CREATE TABLE another_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city_id UUID REFERENCES cities(id),
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  rating NUMERIC(2,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Guests table (updated)
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city_id UUID REFERENCES cities(id),
  id_proof_type TEXT,
  id_proof_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enquiries table
CREATE TABLE enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_number TEXT UNIQUE NOT NULL,
  guest_id UUID REFERENCES guests(id),
  agent_id UUID REFERENCES agents(id),
  check_in_date DATE,
  check_out_date DATE,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  rooms_required INTEGER DEFAULT 1,
  destination_city_id UUID REFERENCES cities(id),
  budget_amount NUMERIC(10,2),
  special_requests TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings table (main bookings)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  reference TEXT,
  enquiry_id UUID REFERENCES enquiries(id),
  guest_id UUID REFERENCES guests(id),
  agent_id UUID REFERENCES agents(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  due_amount NUMERIC(10,2) DEFAULT 0,
  status booking_status DEFAULT 'confirmed',
  payment_status payment_status DEFAULT 'pending',
  special_requests TEXT,
  notes TEXT,
  is_hold BOOLEAN DEFAULT false,
  hold_until TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hotel bookings (rooms in another hotels)
CREATE TABLE hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES another_hotels(id),
  room_type TEXT,
  number_of_rooms INTEGER DEFAULT 1,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  room_rate NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  paid_amount NUMERIC(10,2) DEFAULT 0,
  due_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safari bookings
CREATE TABLE safari_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  safari_name TEXT NOT NULL,
  safari_date DATE NOT NULL,
  number_of_persons INTEGER DEFAULT 1,
  rate_per_person NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  paid_amount NUMERIC(10,2) DEFAULT 0,
  due_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Volvo bookings (Delhi-Manali, Manali-Delhi)
CREATE TABLE volvo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  route TEXT NOT NULL, -- 'delhi_to_manali' or 'manali_to_delhi'
  travel_date DATE NOT NULL,
  number_of_seats INTEGER DEFAULT 1,
  rate_per_seat NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  paid_amount NUMERIC(10,2) DEFAULT 0,
  due_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicle bookings
CREATE TABLE vehicle_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  transporter_id UUID REFERENCES transporters(id),
  vehicle_type vehicle_type,
  vehicle_number TEXT,
  from_location TEXT,
  to_location TEXT,
  pickup_date DATE,
  dropoff_date DATE,
  rate NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  paid_amount NUMERIC(10,2) DEFAULT 0,
  due_amount NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  payment_date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL,
  payment_mode TEXT, -- 'cash', 'bank_transfer', 'cheque', 'upi'
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Group expenses
CREATE TABLE group_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  expense_date DATE DEFAULT CURRENT_DATE,
  category TEXT,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  paid_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cancellations
CREATE TABLE cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  cancellation_date TIMESTAMPTZ DEFAULT now(),
  cancellation_reason TEXT,
  cancellation_charges NUMERIC(10,2) DEFAULT 0,
  refund_amount NUMERIC(10,2) DEFAULT 0,
  cancelled_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Refunds
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancellation_id UUID REFERENCES cancellations(id),
  booking_id UUID REFERENCES bookings(id),
  refund_date DATE DEFAULT CURRENT_DATE,
  refund_amount NUMERIC(10,2) NOT NULL,
  refund_mode TEXT,
  reference_number TEXT,
  notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE another_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE safari_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE volvo_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cities
CREATE POLICY "Authenticated users can view cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Staff can manage cities" ON cities FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

-- RLS Policies for agents
CREATE POLICY "Authenticated users can view agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Staff can manage agents" ON agents FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

-- RLS Policies for transporters
CREATE POLICY "Authenticated users can view transporters" ON transporters FOR SELECT USING (true);
CREATE POLICY "Staff can manage transporters" ON transporters FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

-- RLS Policies for another_hotels
CREATE POLICY "Authenticated users can view hotels" ON another_hotels FOR SELECT USING (true);
CREATE POLICY "Staff can manage hotels" ON another_hotels FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

-- RLS Policies for guests
CREATE POLICY "Authenticated users can view guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Staff can manage guests" ON guests FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
);

-- RLS Policies for enquiries
CREATE POLICY "Authenticated users can view enquiries" ON enquiries FOR SELECT USING (true);
CREATE POLICY "Staff can manage enquiries" ON enquiries FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
);

-- RLS Policies for bookings
CREATE POLICY "Authenticated users can view bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Staff can manage bookings" ON bookings FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
);

-- RLS Policies for hotel_bookings
CREATE POLICY "Authenticated users can view hotel bookings" ON hotel_bookings FOR SELECT USING (true);
CREATE POLICY "Staff can manage hotel bookings" ON hotel_bookings FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
);

-- RLS Policies for safari_bookings
CREATE POLICY "Authenticated users can view safari bookings" ON safari_bookings FOR SELECT USING (true);
CREATE POLICY "Staff can manage safari bookings" ON safari_bookings FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
);

-- RLS Policies for volvo_bookings
CREATE POLICY "Authenticated users can view volvo bookings" ON volvo_bookings FOR SELECT USING (true);
CREATE POLICY "Staff can manage volvo bookings" ON volvo_bookings FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
);

-- RLS Policies for vehicle_bookings
CREATE POLICY "Authenticated users can view vehicle bookings" ON vehicle_bookings FOR SELECT USING (true);
CREATE POLICY "Staff can manage vehicle bookings" ON vehicle_bookings FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
);

-- RLS Policies for payments
CREATE POLICY "Authenticated users can view payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Staff can manage payments" ON payments FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk')
);

-- RLS Policies for group_expenses
CREATE POLICY "Authenticated users can view group expenses" ON group_expenses FOR SELECT USING (true);
CREATE POLICY "Staff can manage group expenses" ON group_expenses FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

-- RLS Policies for cancellations
CREATE POLICY "Authenticated users can view cancellations" ON cancellations FOR SELECT USING (true);
CREATE POLICY "Staff can manage cancellations" ON cancellations FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

-- RLS Policies for refunds
CREATE POLICY "Authenticated users can view refunds" ON refunds FOR SELECT USING (true);
CREATE POLICY "Staff can manage refunds" ON refunds FOR ALL USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
) WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

-- Triggers for updated_at
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transporters_updated_at BEFORE UPDATE ON transporters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_another_hotels_updated_at BEFORE UPDATE ON another_hotels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enquiries_updated_at BEFORE UPDATE ON enquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotel_bookings_updated_at BEFORE UPDATE ON hotel_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_safari_bookings_updated_at BEFORE UPDATE ON safari_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volvo_bookings_updated_at BEFORE UPDATE ON volvo_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_bookings_updated_at BEFORE UPDATE ON vehicle_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();