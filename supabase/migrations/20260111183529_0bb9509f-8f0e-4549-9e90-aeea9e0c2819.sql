-- ==========================================
-- PURCHASE MANAGEMENT MODULE SCHEMA
-- ==========================================

-- 1. VENDORS TABLE
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  contact_person TEXT,
  mobile_number TEXT,
  email TEXT,
  gst_number TEXT,
  address TEXT,
  payment_terms INTEGER DEFAULT 30, -- Days: 7, 15, 30
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vendors" ON public.vendors
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage vendors" ON public.vendors
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  );

-- 2. ITEM CATEGORIES ENUM
CREATE TYPE public.item_category AS ENUM (
  'kitchen_items',
  'housekeeping_items',
  'linen',
  'toiletries',
  'maintenance',
  'other'
);

-- 3. ITEM UNIT ENUM
CREATE TYPE public.item_unit AS ENUM (
  'kg',
  'liter',
  'piece',
  'box',
  'packet',
  'dozen',
  'meter',
  'set'
);

-- 4. ITEM MASTER TABLE
CREATE TABLE public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  category item_category NOT NULL DEFAULT 'other',
  unit item_unit NOT NULL DEFAULT 'piece',
  reorder_level INTEGER DEFAULT 10,
  gst_percentage NUMERIC DEFAULT 18,
  hsn_code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view items" ON public.purchase_items
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage items" ON public.purchase_items
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- 5. DEPARTMENT ENUM
CREATE TYPE public.department_type AS ENUM (
  'kitchen',
  'housekeeping',
  'maintenance',
  'front_desk',
  'admin',
  'other'
);

-- 6. PRIORITY ENUM
CREATE TYPE public.priority_level AS ENUM (
  'low',
  'medium',
  'high'
);

-- 7. PURCHASE REQUEST STATUS
CREATE TYPE public.pr_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- 8. PURCHASE REQUESTS TABLE
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pr_number TEXT NOT NULL UNIQUE,
  department department_type NOT NULL,
  item_id UUID REFERENCES public.purchase_items(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  priority priority_level DEFAULT 'medium',
  remarks TEXT,
  status pr_status DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view PRs" ON public.purchase_requests
  FOR SELECT USING (true);

CREATE POLICY "Staff can create PRs" ON public.purchase_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage PRs" ON public.purchase_requests
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR
    created_by = auth.uid()
  );

CREATE POLICY "Admin can delete PRs" ON public.purchase_requests
  FOR DELETE USING (
    has_role(auth.uid(), 'admin'::app_role)
  );

-- 9. PURCHASE ORDER STATUS
CREATE TYPE public.po_status AS ENUM (
  'created',
  'sent_to_vendor',
  'partially_received',
  'closed',
  'cancelled'
);

-- 10. PURCHASE ORDERS TABLE
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  expected_delivery_date DATE,
  subtotal NUMERIC DEFAULT 0,
  total_gst NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status po_status DEFAULT 'created',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view POs" ON public.purchase_orders
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage POs" ON public.purchase_orders
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  );

-- 11. PURCHASE ORDER ITEMS TABLE
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  pr_id UUID REFERENCES public.purchase_requests(id),
  item_id UUID REFERENCES public.purchase_items(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate NUMERIC NOT NULL DEFAULT 0,
  gst_percentage NUMERIC DEFAULT 18,
  gst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view PO items" ON public.purchase_order_items
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage PO items" ON public.purchase_order_items
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  );

-- 12. GOODS RECEIPT NOTE TABLE
CREATE TABLE public.goods_receipt_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_number TEXT NOT NULL UNIQUE,
  po_id UUID REFERENCES public.purchase_orders(id) NOT NULL,
  receipt_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.goods_receipt_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view GRNs" ON public.goods_receipt_notes
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage GRNs" ON public.goods_receipt_notes
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  );

-- 13. GRN ITEMS TABLE
CREATE TABLE public.grn_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_id UUID REFERENCES public.goods_receipt_notes(id) ON DELETE CASCADE NOT NULL,
  po_item_id UUID REFERENCES public.purchase_order_items(id) NOT NULL,
  item_id UUID REFERENCES public.purchase_items(id) NOT NULL,
  received_quantity INTEGER NOT NULL DEFAULT 0,
  damaged_quantity INTEGER DEFAULT 0,
  accepted_quantity INTEGER GENERATED ALWAYS AS (received_quantity - COALESCE(damaged_quantity, 0)) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.grn_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view GRN items" ON public.grn_items
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage GRN items" ON public.grn_items
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  );

-- 14. PURCHASE INVOICE STATUS
CREATE TYPE public.invoice_payment_status AS ENUM (
  'pending',
  'partially_paid',
  'paid'
);

-- 15. PURCHASE INVOICES TABLE
CREATE TABLE public.purchase_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  vendor_invoice_number TEXT,
  po_id UUID REFERENCES public.purchase_orders(id) NOT NULL,
  grn_id UUID REFERENCES public.goods_receipt_notes(id),
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  balance_amount NUMERIC GENERATED ALWAYS AS (total_amount - COALESCE(paid_amount, 0)) STORED,
  payment_status invoice_payment_status DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices" ON public.purchase_invoices
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage invoices" ON public.purchase_invoices
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  );

-- 16. PURCHASE PAYMENTS TABLE
CREATE TABLE public.purchase_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.purchase_invoices(id) NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  payment_mode TEXT NOT NULL, -- cash, bank_transfer, cheque, upi
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments" ON public.purchase_payments
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage payments" ON public.purchase_payments
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  );

-- 17. INVENTORY TABLE
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.purchase_items(id) NOT NULL UNIQUE,
  current_stock INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory" ON public.inventory
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage inventory" ON public.inventory
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  );

-- 18. INVENTORY HISTORY TABLE (for audit trail)
CREATE TABLE public.inventory_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.purchase_items(id) NOT NULL,
  grn_id UUID REFERENCES public.goods_receipt_notes(id),
  change_type TEXT NOT NULL, -- 'grn_receipt', 'manual_adjustment', 'consumption'
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view history" ON public.inventory_history
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage history" ON public.inventory_history
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'account'::app_role)
  );

-- 19. UPDATED_AT TRIGGERS
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_items_updated_at BEFORE UPDATE ON public.purchase_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goods_receipt_notes_updated_at BEFORE UPDATE ON public.goods_receipt_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_invoices_updated_at BEFORE UPDATE ON public.purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();