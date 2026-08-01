GRANT SELECT, INSERT, UPDATE, DELETE ON public.cities TO authenticated;
GRANT ALL ON public.cities TO service_role;

DROP POLICY IF EXISTS "Staff can manage cities" ON public.cities;
CREATE POLICY "Authenticated users can manage cities"
ON public.cities FOR ALL TO authenticated
USING (true) WITH CHECK (true);