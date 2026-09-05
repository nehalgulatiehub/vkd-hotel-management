CREATE POLICY "Users can process refunds for their own bookings"
ON public.refunds
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = refunds.booking_id
      AND (b.created_by = auth.uid() OR b.created_by IS NULL)
  )
);

CREATE POLICY "Users can update refunds for their own bookings"
ON public.refunds
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = refunds.booking_id
      AND (b.created_by = auth.uid() OR b.created_by IS NULL)
  )
);