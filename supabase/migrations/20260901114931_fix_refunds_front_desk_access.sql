-- Fix: front_desk staff could not process refunds (RLS blocked the insert
-- with no clear error, surfacing only as "Failed to process refund" in the UI).
-- The "Staff can manage payments" and "Staff can manage restaurant payments"
-- policies already include front_desk; refunds was accidentally left out.

DROP POLICY IF EXISTS "Staff can manage refunds" ON public.refunds;

CREATE POLICY "Staff can manage refunds"
ON public.refunds
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'account'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'account'::app_role) OR
  has_role(auth.uid(), 'front_desk'::app_role)
);
