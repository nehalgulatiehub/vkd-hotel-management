-- Restaurant Tables Management
CREATE TABLE public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number TEXT NOT NULL,
  table_name TEXT,
  capacity INTEGER DEFAULT 4,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Food Categories
CREATE TABLE public.food_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Food Items
CREATE TABLE public.food_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.food_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  gst_percentage NUMERIC DEFAULT 5 CHECK (gst_percentage IN (0, 5, 12, 18, 28)),
  hsn_code TEXT,
  is_available BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Restaurant Orders
CREATE TABLE public.restaurant_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  order_type TEXT DEFAULT 'dine_in' CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  subtotal NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  special_instructions TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Restaurant Order Items
CREATE TABLE public.restaurant_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.restaurant_orders(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES public.food_items(id) ON DELETE SET NULL,
  food_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  gst_percentage NUMERIC DEFAULT 5,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  total_price NUMERIC NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Restaurant Invoices
CREATE TABLE public.restaurant_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.restaurant_orders(id) ON DELETE SET NULL,
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  subtotal NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'card', 'split', NULL)),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Restaurant Payments
CREATE TABLE public.restaurant_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.restaurant_invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'card')),
  reference_number TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_tables
CREATE POLICY "Authenticated users can view restaurant tables" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Staff can manage restaurant tables" ON public.restaurant_tables FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk'));

-- RLS Policies for food_categories
CREATE POLICY "Authenticated users can view food categories" ON public.food_categories FOR SELECT USING (true);
CREATE POLICY "Staff can manage food categories" ON public.food_categories FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for food_items
CREATE POLICY "Authenticated users can view food items" ON public.food_items FOR SELECT USING (true);
CREATE POLICY "Staff can manage food items" ON public.food_items FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for restaurant_orders
CREATE POLICY "Authenticated users can view restaurant orders" ON public.restaurant_orders FOR SELECT USING (true);
CREATE POLICY "Staff can manage restaurant orders" ON public.restaurant_orders FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk'));

-- RLS Policies for restaurant_order_items
CREATE POLICY "Authenticated users can view restaurant order items" ON public.restaurant_order_items FOR SELECT USING (true);
CREATE POLICY "Staff can manage restaurant order items" ON public.restaurant_order_items FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk'));

-- RLS Policies for restaurant_invoices
CREATE POLICY "Authenticated users can view restaurant invoices" ON public.restaurant_invoices FOR SELECT USING (true);
CREATE POLICY "Staff can manage restaurant invoices" ON public.restaurant_invoices FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk'));

-- RLS Policies for restaurant_payments
CREATE POLICY "Authenticated users can view restaurant payments" ON public.restaurant_payments FOR SELECT USING (true);
CREATE POLICY "Staff can manage restaurant payments" ON public.restaurant_payments FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'front_desk'));

-- Create triggers for updated_at
CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON public.restaurant_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_food_categories_updated_at BEFORE UPDATE ON public.food_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON public.food_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_orders_updated_at BEFORE UPDATE ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_food_items_category ON public.food_items(category_id);
CREATE INDEX idx_restaurant_orders_table ON public.restaurant_orders(table_id);
CREATE INDEX idx_restaurant_orders_status ON public.restaurant_orders(status);
CREATE INDEX idx_restaurant_order_items_order ON public.restaurant_order_items(order_id);
CREATE INDEX idx_restaurant_invoices_order ON public.restaurant_invoices(order_id);
CREATE INDEX idx_restaurant_payments_invoice ON public.restaurant_payments(invoice_id);