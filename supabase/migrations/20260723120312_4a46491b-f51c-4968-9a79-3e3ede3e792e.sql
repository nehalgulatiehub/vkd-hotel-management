DROP POLICY IF EXISTS "Staff can manage transporters" ON public.transporters;
DROP POLICY IF EXISTS "Authenticated users can view transporters" ON public.transporters;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transporters TO authenticated;
GRANT ALL ON public.transporters TO service_role;

CREATE POLICY "Authenticated users can view transporters"
ON public.transporters
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage transporters"
ON public.transporters
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);