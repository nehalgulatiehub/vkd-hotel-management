BEGIN;
-- Payments already trigger this recalculation. Booking edits replace service
-- rows, so those rows must trigger it too, even when payments have not changed.
-- Limit UPDATE events to source fields: updating paid/due totals inside the
-- recalculation function must never recursively fire this trigger.
DO $$ DECLARE service_table text; source_columns text; BEGIN
  FOREACH service_table IN ARRAY ARRAY['hotel_bookings', 'safari_bookings',
    'vehicle_bookings', 'volvo_bookings', 'visa_bookings', 'cruise_bookings'] LOOP
    source_columns := 'booking_id, total_amount';
    IF service_table = 'hotel_bookings' THEN source_columns := source_columns || ', hotel_id, own_hotel_id'; END IF;
    IF service_table = 'volvo_bookings' THEN source_columns := source_columns || ', route'; END IF;
    EXECUTE format('DROP TRIGGER IF EXISTS service_sync_payment_totals ON public.%I', service_table);
    EXECUTE format('CREATE TRIGGER service_sync_payment_totals AFTER INSERT OR DELETE OR UPDATE OF %s ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sync_booking_payment_totals()', source_columns, service_table);
  END LOOP;
END $$;

-- Archive the incorrect derived values before repair; transactions and service
-- prices remain the source of truth and are never edited by this migration.
CREATE TABLE IF NOT EXISTS public.service_payment_total_repairs (
  service_table text NOT NULL,
  service_id uuid NOT NULL,
  booking_id uuid NOT NULL,
  previous_paid numeric,
  previous_due numeric,
  expected_paid numeric NOT NULL,
  repaired_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (service_table, service_id)
);
ALTER TABLE public.service_payment_total_repairs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.service_payment_total_repairs FROM anon, authenticated;

WITH services AS (
  SELECT 'hotel_bookings' AS service_table, 'hotel' AS module, id, booking_id, total_amount, paid_amount, due_amount FROM public.hotel_bookings WHERE hotel_id IS NOT NULL
  UNION ALL SELECT 'safari_bookings', 'safari', id, booking_id, total_amount, paid_amount, due_amount FROM public.safari_bookings
  UNION ALL SELECT 'vehicle_bookings', 'vehicle', id, booking_id, total_amount, paid_amount, due_amount FROM public.vehicle_bookings
  UNION ALL SELECT 'volvo_bookings', CASE WHEN route = 'delhi_manali' THEN 'volvo_dm' ELSE 'volvo_md' END, id, booking_id, total_amount, paid_amount, due_amount FROM public.volvo_bookings
  UNION ALL SELECT 'visa_bookings', 'visa', id, booking_id, total_amount, paid_amount, due_amount FROM public.visa_bookings
  UNION ALL SELECT 'cruise_bookings', 'cruise', id, booking_id, total_amount, paid_amount, due_amount FROM public.cruise_bookings
), expected AS (
  SELECT s.*, COALESCE((SELECT sum(p.amount) FROM public.payments p WHERE p.booking_id = s.booking_id AND
    CASE s.module
      WHEN 'hotel' THEN lower(COALESCE(p.payment_type, '')) IN ('another_hotel', 'hotel', 'hotel_direct')
      WHEN 'safari' THEN lower(COALESCE(p.payment_type, '')) IN ('safari', 'safari_direct')
      WHEN 'vehicle' THEN lower(COALESCE(p.payment_type, '')) IN ('vehicle', 'another_vehicle', 'vehicle_direct')
      WHEN 'volvo_dm' THEN lower(COALESCE(p.payment_type, '')) IN ('delhi_manali', 'volvo_dm')
      WHEN 'volvo_md' THEN lower(COALESCE(p.payment_type, '')) IN ('manali_delhi', 'volvo_md')
      ELSE lower(COALESCE(p.payment_type, '')) = s.module END), 0) AS actual_paid
  FROM services s
)
INSERT INTO public.service_payment_total_repairs(service_table, service_id, booking_id, previous_paid, previous_due, expected_paid)
SELECT service_table, id, booking_id, paid_amount, due_amount, actual_paid FROM expected
WHERE booking_id IS NOT NULL AND (paid_amount IS DISTINCT FROM actual_paid
  OR due_amount IS DISTINCT FROM greatest(COALESCE(total_amount, 0) - actual_paid, 0))
ON CONFLICT (service_table, service_id) DO NOTHING;

DO $$ DECLARE target_id uuid; BEGIN
  FOR target_id IN SELECT DISTINCT booking_id FROM public.service_payment_total_repairs LOOP
    PERFORM public.recalculate_payment_totals_for_booking(target_id);
  END LOOP;
END $$;
COMMIT;
