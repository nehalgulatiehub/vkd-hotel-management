-- Insert 30 payments for various bookings
INSERT INTO public.payments (booking_id, amount, payment_date, payment_mode, reference_number, notes)
SELECT 
  b.id as booking_id,
  b.paid_amount as amount,
  b.check_in_date - interval '5 days' as payment_date,
  CASE floor(random() * 4)::int
    WHEN 0 THEN 'Net Banking'
    WHEN 1 THEN 'UPI'
    WHEN 2 THEN 'Cash'
    ELSE 'Card'
  END as payment_mode,
  'REF-' || floor(random() * 900000 + 100000)::text as reference_number,
  'Advance payment received'
FROM bookings b
WHERE b.paid_amount > 0
ORDER BY b.created_at
LIMIT 30;