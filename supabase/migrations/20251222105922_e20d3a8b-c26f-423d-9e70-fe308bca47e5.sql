-- Add gst_percentage and gst_type columns to restaurant_orders
ALTER TABLE public.restaurant_orders 
ADD COLUMN IF NOT EXISTS gst_percentage numeric DEFAULT 5,
ADD COLUMN IF NOT EXISTS gst_type text DEFAULT 'cgst_sgst';