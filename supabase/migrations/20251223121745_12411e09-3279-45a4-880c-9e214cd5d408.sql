-- Add date column to billing_invoice_items table
ALTER TABLE public.billing_invoice_items 
ADD COLUMN item_date TEXT;