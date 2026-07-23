DROP POLICY IF EXISTS "Staff can manage hotels" ON public.another_hotels;
DROP POLICY IF EXISTS "Staff can manage own hotels" ON public.own_hotels;
CREATE POLICY "Authenticated users can manage another hotels" ON public.another_hotels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage own hotels" ON public.own_hotels FOR ALL TO authenticated USING (true) WITH CHECK (true);