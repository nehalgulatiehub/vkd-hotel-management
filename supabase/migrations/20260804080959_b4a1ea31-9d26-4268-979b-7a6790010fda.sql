GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;

DROP POLICY IF EXISTS "Staff can manage enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Authenticated users can view enquiries" ON public.enquiries;

CREATE POLICY "Authenticated users can view enquiries"
ON public.enquiries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage enquiries"
ON public.enquiries FOR ALL TO authenticated USING (true) WITH CHECK (true);