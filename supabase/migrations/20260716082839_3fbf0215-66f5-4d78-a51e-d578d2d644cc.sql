
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'purchase_items','purchase_orders','purchase_order_items','purchase_requests','purchase_request_items',
    'goods_receipts','goods_receipt_items','purchase_invoices','purchase_invoice_items','purchase_payments',
    'inventory','inventory_transactions','vendors',
    'restaurant_orders','restaurant_order_items','restaurant_invoices','restaurant_tables',
    'food_menu','food_menu_items'
  ];
  p record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
      END LOOP;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('CREATE POLICY "Authenticated users can manage %I" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    END IF;
  END LOOP;
END $$;
