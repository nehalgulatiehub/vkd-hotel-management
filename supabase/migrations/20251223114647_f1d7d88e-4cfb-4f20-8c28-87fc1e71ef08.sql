-- Create company_settings table to store billing details and logo
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'DKV HOTEL MANAGEMENT',
  sub_title TEXT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  contact_no TEXT DEFAULT NULL,
  gstin TEXT DEFAULT NULL,
  pan_no TEXT DEFAULT NULL,
  hsn_code TEXT DEFAULT '996311',
  logo_url TEXT DEFAULT NULL,
  bank_name TEXT DEFAULT NULL,
  account_no TEXT DEFAULT NULL,
  ifsc_code TEXT DEFAULT NULL,
  branch_name TEXT DEFAULT NULL,
  terms_conditions TEXT DEFAULT 'This is computer generated invoice no signature and stamp required.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view settings
CREATE POLICY "Authenticated users can view company settings"
ON public.company_settings
FOR SELECT
USING (true);

-- Allow admin/manager to manage settings
CREATE POLICY "Staff can manage company settings"
ON public.company_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Insert default settings
INSERT INTO public.company_settings (company_name, address, hsn_code)
VALUES ('DKV HOTEL MANAGEMENT', 'Manali, Himachal Pradesh', '996311');