-- Keep every booking and service-module received/due total derived from payments.
-- This closes gaps from legacy aliases and payment paths that did not call the
-- frontend recalculation helper.
CREATE OR REPLACE FUNCTION public.recalculate_payment_totals_for_booking(target_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  all_paid numeric;
BEGIN
  IF target_booking_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(p.amount), 0)
  INTO all_paid
  FROM public.payments p
  WHERE p.booking_id = target_booking_id;

  UPDATE public.bookings b
  SET paid_amount = all_paid,
      due_amount = GREATEST(COALESCE(b.total_amount, 0) - all_paid, 0),
      payment_status = CASE
        WHEN all_paid <= 0 THEN 'pending'::payment_status
        WHEN COALESCE(b.total_amount, 0) - all_paid <= 0 THEN 'paid'::payment_status
        ELSE 'partial'::payment_status
      END,
      updated_at = now()
  WHERE b.id = target_booking_id;

  UPDATE public.hotel_bookings hb
  SET paid_amount = totals.paid,
      due_amount = GREATEST(COALESCE(hb.total_amount, 0) - totals.paid, 0),
      updated_at = now()
  FROM (
    SELECT COALESCE(SUM(p.amount), 0) AS paid
    FROM public.payments p
    WHERE p.booking_id = target_booking_id
      AND lower(COALESCE(p.payment_type, '')) IN ('another_hotel', 'hotel', 'hotel_direct')
  ) totals
  WHERE hb.booking_id = target_booking_id AND hb.hotel_id IS NOT NULL;

  UPDATE public.safari_bookings sb
  SET paid_amount = totals.paid,
      due_amount = GREATEST(COALESCE(sb.total_amount, 0) - totals.paid, 0),
      updated_at = now()
  FROM (
    SELECT COALESCE(SUM(p.amount), 0) AS paid
    FROM public.payments p
    WHERE p.booking_id = target_booking_id
      AND lower(COALESCE(p.payment_type, '')) IN ('safari', 'safari_direct')
  ) totals
  WHERE sb.booking_id = target_booking_id;

  UPDATE public.vehicle_bookings vb
  SET paid_amount = totals.paid,
      due_amount = GREATEST(COALESCE(vb.total_amount, 0) - totals.paid, 0),
      updated_at = now()
  FROM (
    SELECT COALESCE(SUM(p.amount), 0) AS paid
    FROM public.payments p
    WHERE p.booking_id = target_booking_id
      AND lower(COALESCE(p.payment_type, '')) IN ('vehicle', 'another_vehicle', 'vehicle_direct')
  ) totals
  WHERE vb.booking_id = target_booking_id;

  UPDATE public.volvo_bookings vb
  SET paid_amount = totals.paid,
      due_amount = GREATEST(COALESCE(vb.total_amount, 0) - totals.paid, 0),
      updated_at = now()
  FROM (
    SELECT COALESCE(SUM(p.amount), 0) AS paid
    FROM public.payments p
    WHERE p.booking_id = target_booking_id
      AND lower(COALESCE(p.payment_type, '')) IN ('delhi_manali', 'volvo_dm')
  ) totals
  WHERE vb.booking_id = target_booking_id AND vb.route = 'delhi_manali';

  UPDATE public.volvo_bookings vb
  SET paid_amount = totals.paid,
      due_amount = GREATEST(COALESCE(vb.total_amount, 0) - totals.paid, 0),
      updated_at = now()
  FROM (
    SELECT COALESCE(SUM(p.amount), 0) AS paid
    FROM public.payments p
    WHERE p.booking_id = target_booking_id
      AND lower(COALESCE(p.payment_type, '')) IN ('manali_delhi', 'volvo_md')
  ) totals
  WHERE vb.booking_id = target_booking_id AND vb.route = 'manali_delhi';

  UPDATE public.visa_bookings vb
  SET paid_amount = totals.paid,
      due_amount = GREATEST(COALESCE(vb.total_amount, 0) - totals.paid, 0),
      updated_at = now()
  FROM (
    SELECT COALESCE(SUM(p.amount), 0) AS paid
    FROM public.payments p
    WHERE p.booking_id = target_booking_id AND lower(COALESCE(p.payment_type, '')) = 'visa'
  ) totals
  WHERE vb.booking_id = target_booking_id;

  UPDATE public.cruise_bookings cb
  SET paid_amount = totals.paid,
      due_amount = GREATEST(COALESCE(cb.total_amount, 0) - totals.paid, 0),
      updated_at = now()
  FROM (
    SELECT COALESCE(SUM(p.amount), 0) AS paid
    FROM public.payments p
    WHERE p.booking_id = target_booking_id AND lower(COALESCE(p.payment_type, '')) = 'cruise'
  ) totals
  WHERE cb.booking_id = target_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_booking_payment_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'DELETE' THEN
    PERFORM public.recalculate_payment_totals_for_booking(NEW.booking_id);
  END IF;

  IF TG_OP <> 'INSERT' AND (TG_OP = 'DELETE' OR OLD.booking_id IS DISTINCT FROM NEW.booking_id) THEN
    PERFORM public.recalculate_payment_totals_for_booking(OLD.booking_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS payments_sync_booking_totals ON public.payments;
CREATE TRIGGER payments_sync_booking_totals
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_payment_totals();

-- Repair existing derived totals without changing any payment transaction.
DO $$
DECLARE
  booking_record record;
BEGIN
  FOR booking_record IN
    SELECT id FROM public.bookings
  LOOP
    PERFORM public.recalculate_payment_totals_for_booking(booking_record.id);
  END LOOP;
END;
$$;
