-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Staff can manage bookings" ON public.bookings;

-- Create a new policy that also checks for menu permissions
CREATE POLICY "Staff can manage bookings" 
ON public.bookings 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_role(auth.uid(), 'account'::app_role) OR
  has_menu_access(auth.uid(), 'bookings')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_role(auth.uid(), 'account'::app_role) OR
  has_menu_access(auth.uid(), 'bookings')
);