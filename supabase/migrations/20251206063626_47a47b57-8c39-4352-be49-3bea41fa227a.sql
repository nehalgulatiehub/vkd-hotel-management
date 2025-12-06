-- Insert vehicle bookings with correct vehicle_type enum
INSERT INTO public.vehicle_bookings (booking_id, transporter_id, vehicle_type, vehicle_number, pickup_date, dropoff_date, from_location, to_location, rate, total_amount, paid_amount, due_amount, notes)
SELECT 
  b.id as booking_id,
  (SELECT id FROM transporters ORDER BY created_at LIMIT 1) as transporter_id,
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'car'::vehicle_type
    WHEN 1 THEN 'tempo_traveller'::vehicle_type
    ELSE 'bus'::vehicle_type
  END as vehicle_type,
  'DL ' || floor(random() * 10 + 1)::text || 'C ' || floor(random() * 9000 + 1000)::text as vehicle_number,
  b.check_in_date as pickup_date,
  b.check_out_date as dropoff_date,
  'Delhi' as from_location,
  'Corbett' as to_location,
  CASE WHEN b.adults > 10 THEN 15000 ELSE 7000 END as rate,
  CASE WHEN b.adults > 10 THEN 30000 ELSE 14000 END as total_amount,
  CASE WHEN b.adults > 10 THEN 25000 ELSE 10000 END as paid_amount,
  CASE WHEN b.adults > 10 THEN 5000 ELSE 4000 END as due_amount,
  'Vehicle booking for sightseeing'
FROM bookings b
WHERE (b.include_additional_vehicle = true OR b.total_amount > 50000)
  AND NOT EXISTS (SELECT 1 FROM vehicle_bookings vb WHERE vb.booking_id = b.id)
LIMIT 25;