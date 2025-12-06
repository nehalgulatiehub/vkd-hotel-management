-- Insert 25 hotel bookings linked to existing bookings
INSERT INTO public.hotel_bookings (booking_id, hotel_id, check_in_date, check_out_date, room_type, number_of_rooms, room_rate, total_amount, paid_amount, due_amount, notes)
SELECT 
  b.id as booking_id,
  (SELECT id FROM another_hotels ORDER BY created_at LIMIT 1) as hotel_id,
  b.check_in_date,
  b.check_out_date,
  CASE 
    WHEN b.total_amount > 50000 THEN 'Premium Suite'
    WHEN b.total_amount > 20000 THEN 'Superior'
    ELSE 'Deluxe'
  END as room_type,
  CASE WHEN b.adults > 10 THEN 5 WHEN b.adults > 4 THEN 3 ELSE 1 END as number_of_rooms,
  CASE 
    WHEN b.total_amount > 50000 THEN 8000
    WHEN b.total_amount > 20000 THEN 5000
    ELSE 3000
  END as room_rate,
  b.total_amount * 0.5 as total_amount,
  b.paid_amount * 0.5 as paid_amount,
  b.due_amount * 0.5 as due_amount,
  'Hotel booking from legacy data'
FROM bookings b
WHERE b.include_booking = true
LIMIT 25;