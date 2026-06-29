
-- Quotations module mirroring billing/invoices
CREATE TABLE public.quotation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  company_name TEXT,
  sub_title TEXT,
  address TEXT,
  contact_no TEXT,
  gstin TEXT,
  pan_no TEXT,
  hsn_code TEXT,
  logo_url TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  branch_name TEXT,
  terms_conditions TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_templates TO authenticated;
GRANT ALL ON public.quotation_templates TO service_role;
ALTER TABLE public.quotation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage quotation templates" ON public.quotation_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_quotation_templates_updated BEFORE UPDATE ON public.quotation_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL,
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  booking_id UUID,
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
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage quotations" ON public.quotations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_quotations_updated BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_quotations_created_by BEFORE INSERT ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TABLE public.quotation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  sr_no INTEGER,
  item_date TEXT,
  particulars TEXT,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_items TO authenticated;
GRANT ALL ON public.quotation_items TO service_role;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage quotation items" ON public.quotation_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
