-- Create billing invoices table
CREATE TABLE public.billing_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  booking_id UUID REFERENCES public.bookings(id),
  customer_name TEXT,
  customer_address TEXT,
  customer_gstin TEXT,
  customer_pan TEXT,
  subtotal NUMERIC DEFAULT 0,
  total_cgst NUMERIC DEFAULT 0,
  total_sgst NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  amount_in_words TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing invoice items table
CREATE TABLE public.billing_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  particulars TEXT NOT NULL,
  hsn_code TEXT,
  quantity INTEGER DEFAULT 1,
  rate NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  cgst_percent NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_percent NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for billing_invoices
CREATE POLICY "Authenticated users can view billing invoices" 
ON public.billing_invoices FOR SELECT USING (true);

CREATE POLICY "Staff can manage billing invoices" 
ON public.billing_invoices FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'front_desk'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'front_desk'::app_role));

-- RLS Policies for billing_invoice_items
CREATE POLICY "Authenticated users can view billing invoice items" 
ON public.billing_invoice_items FOR SELECT USING (true);

CREATE POLICY "Staff can manage billing invoice items" 
ON public.billing_invoice_items FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'front_desk'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'front_desk'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_billing_invoices_updated_at
BEFORE UPDATE ON public.billing_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();