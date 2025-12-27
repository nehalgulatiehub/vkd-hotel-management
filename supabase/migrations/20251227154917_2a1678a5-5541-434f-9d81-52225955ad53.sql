-- Create invoice_templates table for storing multiple company templates
CREATE TABLE public.invoice_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  sub_title TEXT,
  address TEXT,
  contact_no TEXT,
  gstin TEXT,
  pan_no TEXT,
  hsn_code TEXT DEFAULT '996311',
  logo_url TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  branch_name TEXT,
  terms_conditions TEXT DEFAULT 'This is computer generated invoice no signature and stamp required.',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view invoice templates" 
ON public.invoice_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage invoice templates" 
ON public.invoice_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_invoice_templates_updated_at
BEFORE UPDATE ON public.invoice_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();