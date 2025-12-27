-- Create module enum for available modules
CREATE TYPE public.app_module AS ENUM ('bookings', 'payments', 'restaurant', 'hotels', 'transporters');

-- Create user_module_assignments table for module-based access control
CREATE TABLE public.user_module_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    module app_module NOT NULL,
    assigned_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, module)
);

-- Enable RLS on user_module_assignments
ALTER TABLE public.user_module_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_module_assignments
CREATE POLICY "Users can view module assignments"
ON public.user_module_assignments FOR SELECT
USING (true);

CREATE POLICY "Admin and Account can manage module assignments"
ON public.user_module_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account'::app_role));

-- Add approval_status column to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Add approval_status column to restaurant_payments table
ALTER TABLE public.restaurant_payments 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Add approval_status column to refunds table
ALTER TABLE public.refunds 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Create function to check module access
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module app_module)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin and Account always have access to all modules
    has_role(_user_id, 'admin'::app_role) OR 
    has_role(_user_id, 'account'::app_role) OR
    -- Check module assignment for other users
    EXISTS (
      SELECT 1
      FROM public.user_module_assignments
      WHERE user_id = _user_id AND module = _module
    )
$$;

-- Create function to check if user can approve payments
-- Admin can approve all, Account can approve all except cash
CREATE OR REPLACE FUNCTION public.can_approve_payment(_user_id uuid, _payment_mode text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin can approve all payment types
    has_role(_user_id, 'admin'::app_role) OR
    -- Account can approve all except cash
    (has_role(_user_id, 'account'::app_role) AND LOWER(COALESCE(_payment_mode, '')) != 'cash')
$$;

-- Update user_roles RLS to allow account users to manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admin and Account can manage roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account'::app_role));