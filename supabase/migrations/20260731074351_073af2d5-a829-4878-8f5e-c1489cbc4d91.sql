CREATE OR REPLACE FUNCTION public.sync_booking_payment_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b_id uuid;
  total_paid numeric;
  total_amt numeric;
  due numeric;
BEGIN
  b_id := COALESCE(NEW.booking_id, OLD.booking_id);
  IF b_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO total_paid FROM public.payments WHERE booking_id = b_id;
  SELECT COALESCE(total_amount, 0) INTO total_amt FROM public.bookings WHERE id = b_id;
  due := GREATEST(total_amt - total_paid, 0);

  UPDATE public.bookings
  SET paid_amount = total_paid,
      due_amount = due,
      payment_status = CASE
        WHEN total_paid <= 0 THEN 'pending'::payment_status
        WHEN due <= 0 THEN 'paid'::payment_status
        ELSE 'partial'::payment_status
      END,
      updated_at = now()
  WHERE id = b_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS payments_sync_booking_totals ON public.payments;
CREATE TRIGGER payments_sync_booking_totals
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.sync_booking_payment_totals();

-- Backfill existing bookings
UPDATE public.bookings b
SET paid_amount = s.total_paid,
    due_amount = GREATEST(COALESCE(b.total_amount,0) - s.total_paid, 0),
    payment_status = CASE
      WHEN s.total_paid <= 0 THEN 'pending'::payment_status
      WHEN COALESCE(b.total_amount,0) - s.total_paid <= 0 THEN 'paid'::payment_status
      ELSE 'partial'::payment_status
    END
FROM (
  SELECT b2.id, COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.booking_id = b2.id), 0) AS total_paid
  FROM public.bookings b2
) s
WHERE b.id = s.id;