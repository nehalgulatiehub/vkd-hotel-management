-- Insert 20 group expenses for bookings with group expenses flag
INSERT INTO public.group_expenses (booking_id, category, description, amount, expense_date, notes)
SELECT 
  b.id as booking_id,
  CASE floor(random() * 5)::int
    WHEN 0 THEN 'DJ & Music'
    WHEN 1 THEN 'Bonfire'
    WHEN 2 THEN 'Team Building'
    WHEN 3 THEN 'Decoration'
    ELSE 'Catering Extra'
  END as category,
  'Group activity expense' as description,
  CASE floor(random() * 5)::int
    WHEN 0 THEN 5000
    WHEN 1 THEN 7000
    WHEN 2 THEN 10000
    WHEN 3 THEN 15000
    ELSE 20000
  END as amount,
  b.check_in_date as expense_date,
  'Expense for group event'
FROM bookings b
WHERE b.include_group_expenses = true
LIMIT 20;