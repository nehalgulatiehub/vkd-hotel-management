UPDATE public.bookings AS b
SET
  paid_amount = totals.total_received,
  due_amount = GREATEST(0, COALESCE(b.total_amount, 0) - totals.total_received),
  payment_status = (CASE
    WHEN totals.total_received <= 0 THEN 'pending'
    WHEN COALESCE(b.total_amount, 0) - totals.total_received <= 0 THEN 'paid'
    ELSE 'partial'
  END)::payment_status
FROM (
  SELECT
    booking_id,
    COALESCE(SUM(amount), 0) AS total_received
  FROM public.payments
  WHERE booking_id IS NOT NULL
  GROUP BY booking_id
) AS totals
WHERE b.id = totals.booking_id;

UPDATE public.bookings AS b
SET
  paid_amount = 0,
  due_amount = GREATEST(0, COALESCE(b.total_amount, 0)),
  payment_status = (CASE
    WHEN COALESCE(b.total_amount, 0) <= 0 THEN 'paid'
    ELSE 'pending'
  END)::payment_status
WHERE NOT EXISTS (
  SELECT 1
  FROM public.payments AS p
  WHERE p.booking_id = b.id
);