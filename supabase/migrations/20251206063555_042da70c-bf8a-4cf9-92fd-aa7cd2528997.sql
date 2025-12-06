-- Insert 25 volvo bookings (Delhi-Manali and Manali-Delhi routes)
INSERT INTO public.volvo_bookings (booking_id, route, travel_date, number_of_seats, rate_per_seat, total_amount, paid_amount, due_amount, notes)
SELECT 
  b.id as booking_id,
  CASE WHEN b.include_delhi_manali THEN 'Delhi-Manali' ELSE 'Manali-Delhi' END as route,
  b.check_in_date as travel_date,
  CASE WHEN b.adults > 10 THEN 20 ELSE b.adults END as number_of_seats,
  1800 as rate_per_seat,
  CASE WHEN b.adults > 10 THEN 36000 ELSE b.adults * 1800 END as total_amount,
  CASE WHEN b.adults > 10 THEN 30000 ELSE b.adults * 1500 END as paid_amount,
  CASE WHEN b.adults > 10 THEN 6000 ELSE b.adults * 300 END as due_amount,
  'Volvo AC Sleeper'
FROM bookings b
WHERE b.include_delhi_manali = true OR b.include_manali_delhi = true
LIMIT 25;