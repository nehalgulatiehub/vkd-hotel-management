DROP POLICY IF EXISTS "Staff can manage vendors" ON public.vendors;
CREATE POLICY "Authenticated users can manage vendors"
ON public.vendors
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);