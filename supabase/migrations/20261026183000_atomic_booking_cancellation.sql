CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid,
  p_charges numeric DEFAULT 0,
  p_reason text DEFAULT NULL,
  p_booking_total numeric DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE booking_row record; cancellation_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in again'; END IF;
  IF p_charges IS NULL OR p_charges < 0 OR p_charges::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'Enter a valid non-negative cancellation charge';
  END IF;
  IF p_booking_total IS NOT NULL AND (p_booking_total < 0 OR p_booking_total::text IN ('NaN', 'Infinity', '-Infinity')) THEN
    RAISE EXCEPTION 'Enter a valid non-negative booking price';
  END IF;
  SELECT * INTO booking_row FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking no longer exists'; END IF;
  IF NOT COALESCE(
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'account') OR
    public.has_role(auth.uid(), 'manager') OR booking_row.created_by = auth.uid(), false
  ) THEN RAISE EXCEPTION 'You can only cancel bookings you created'; END IF;

  -- Repeated clicks/requests must not create multiple cancellation records.
  IF booking_row.status = 'cancelled' THEN
    SELECT id INTO cancellation_id FROM public.cancellations WHERE booking_id = p_booking_id
      ORDER BY created_at DESC LIMIT 1;
    RETURN cancellation_id;
  END IF;
  INSERT INTO public.cancellations(booking_id, cancelled_by, cancellation_date, cancellation_reason, cancellation_charges, refund_amount)
  VALUES (p_booking_id, auth.uid(), (now() AT TIME ZONE 'Asia/Kolkata')::date,
    COALESCE(NULLIF(trim(p_reason), ''), 'Cancelled by user'), p_charges,
    greatest(0, COALESCE(booking_row.paid_amount, 0) - p_charges))
  RETURNING id INTO cancellation_id;
  UPDATE public.bookings SET status = 'cancelled',
    total_amount = COALESCE(p_booking_total, total_amount), updated_at = now()
    WHERE id = p_booking_id;
  RETURN cancellation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_booking(uuid, numeric, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid, numeric, text, numeric) TO authenticated;
