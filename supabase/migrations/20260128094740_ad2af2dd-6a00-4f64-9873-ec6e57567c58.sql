-- Fix the safari_bookings record that was not synced when payment was approved
UPDATE safari_bookings 
SET paid_amount = 7000, due_amount = 0 
WHERE id = '2b37849d-ff1f-4c75-8f6a-88f0afe0c92d';

-- Also check and fix any other safari_bookings that might have the same issue
-- Update safari_bookings where there are approved safari payments but paid_amount is still 0
UPDATE safari_bookings sb
SET paid_amount = COALESCE((
  SELECT SUM(p.amount) 
  FROM payments p 
  WHERE p.booking_id = sb.booking_id 
  AND p.payment_type = 'safari' 
  AND p.approval_status = 'approved'
), 0),
due_amount = sb.total_amount - COALESCE((
  SELECT SUM(p.amount) 
  FROM payments p 
  WHERE p.booking_id = sb.booking_id 
  AND p.payment_type = 'safari' 
  AND p.approval_status = 'approved'
), 0)
WHERE sb.paid_amount = 0 
AND EXISTS (
  SELECT 1 FROM payments p 
  WHERE p.booking_id = sb.booking_id 
  AND p.payment_type = 'safari' 
  AND p.approval_status = 'approved'
);