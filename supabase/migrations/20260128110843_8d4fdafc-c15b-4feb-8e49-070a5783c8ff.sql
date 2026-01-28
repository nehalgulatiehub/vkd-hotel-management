-- Allow users with booking module permissions to create/manage bookings and related service rows.
-- This fixes: "new row violates row-level security policy" for non-admin booking users.

-- bookings
DROP POLICY IF EXISTS "Staff can manage bookings" ON public.bookings;
CREATE POLICY "Staff can manage bookings"
ON public.bookings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_role(auth.uid(), 'account'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_role(auth.uid(), 'account'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
);

-- hotel_bookings
DROP POLICY IF EXISTS "Staff can manage hotel bookings" ON public.hotel_bookings;
CREATE POLICY "Staff can manage hotel bookings"
ON public.hotel_bookings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
);

-- safari_bookings
DROP POLICY IF EXISTS "Staff can manage safari bookings" ON public.safari_bookings;
CREATE POLICY "Staff can manage safari bookings"
ON public.safari_bookings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
);

-- vehicle_bookings
DROP POLICY IF EXISTS "Staff can manage vehicle bookings" ON public.vehicle_bookings;
CREATE POLICY "Staff can manage vehicle bookings"
ON public.vehicle_bookings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
);

-- volvo_bookings
DROP POLICY IF EXISTS "Staff can manage volvo bookings" ON public.volvo_bookings;
CREATE POLICY "Staff can manage volvo bookings"
ON public.volvo_bookings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
);

-- group_expenses (created during booking creation when enabled)
DROP POLICY IF EXISTS "Staff can manage group expenses" ON public.group_expenses;
CREATE POLICY "Staff can manage group expenses"
ON public.group_expenses
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_menu_access(auth.uid(), 'bookings'::text) OR
  has_menu_access(auth.uid(), 'bookings_add'::text) OR
  has_menu_access(auth.uid(), 'bookings_hold_create'::text)
);
