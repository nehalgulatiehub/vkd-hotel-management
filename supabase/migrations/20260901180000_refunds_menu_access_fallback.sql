-- Staff accounts that rely on per-menu permissions (no formal app_role row,
-- e.g. front-desk staff granted access via menu_permissions) could already
-- add/edit payments and bookings thanks to the has_menu_access(...) fallback
-- on those tables' policies. The refunds policy never had that fallback, so
-- those same staff could see the Refunds menu but every submission silently
-- failed RLS. Bring refunds in line with payments/bookings.

DROP POLICY IF EXISTS "Staff can manage refunds" ON public.refunds;

CREATE POLICY "Staff can manage refunds"
ON public.refunds
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'account'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'refunds'::text)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'account'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role) OR
  has_menu_access(auth.uid(), 'refunds'::text)
);
