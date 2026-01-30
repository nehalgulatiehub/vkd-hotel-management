-- Drop existing policy for payments management
DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;

-- Create updated policy that includes menu-based permissions
CREATE POLICY "Staff can manage payments" 
ON public.payments 
FOR ALL 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'front_desk'::app_role) OR 
  has_role(auth.uid(), 'account'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_view'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'front_desk'::app_role) OR 
  has_role(auth.uid(), 'account'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_view'::text)
);