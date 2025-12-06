-- Insert 20 safari bookings
INSERT INTO public.safari_bookings (booking_id, safari_name, safari_date, number_of_persons, rate_per_person, total_amount, paid_amount, due_amount, notes)
SELECT 
  b.id as booking_id,
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'Bijrani Zone Safari'
    WHEN 1 THEN 'Dhikala Zone Safari'
    ELSE 'Jhirna Zone Safari'
  END as safari_name,
  b.check_in_date + interval '1 day' as safari_date,
  b.adults as number_of_persons,
  5200 as rate_per_person,
  b.adults * 5200 as total_amount,
  b.adults * 5200 as paid_amount,
  0 as due_amount,
  'Safari booking - morning slot'
FROM bookings b
WHERE b.include_safari = true
LIMIT 20;