BEGIN;
-- The Booking form has one own-hotel section per booking. Exact duplicate rows
-- from repeated saves must not double room counts or service prices.
LOCK TABLE public.hotel_bookings IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE IF NOT EXISTS public.hotel_booking_duplicate_repairs (
  original_id uuid PRIMARY KEY,
  kept_id uuid NOT NULL,
  booking_id uuid NOT NULL,
  original_record jsonb NOT NULL,
  repaired_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hotel_booking_duplicate_repairs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hotel_booking_duplicate_repairs FROM anon, authenticated;

-- Abort rather than choosing between different room selections or quantities.
DO $$ BEGIN
  IF EXISTS (
    SELECT booking_id FROM public.hotel_bookings hb WHERE own_hotel_id IS NOT NULL
    GROUP BY booking_id HAVING count(*) > 1
      AND count(DISTINCT (to_jsonb(hb) - 'id' - 'created_at' - 'updated_at')) > 1
  ) THEN
    RAISE EXCEPTION 'Different own-hotel rows need manual review; no rows repaired';
  END IF;
END $$;

WITH ranked AS (
  SELECT hb.*, row_number() OVER (PARTITION BY booking_id ORDER BY created_at, id) AS rank,
    first_value(id) OVER (PARTITION BY booking_id ORDER BY created_at, id) AS kept_id
  FROM public.hotel_bookings hb WHERE own_hotel_id IS NOT NULL
)
INSERT INTO public.hotel_booking_duplicate_repairs(original_id, kept_id, booking_id, original_record)
SELECT id, kept_id, booking_id, to_jsonb(ranked) - 'rank' - 'kept_id' FROM ranked WHERE rank > 1
ON CONFLICT (original_id) DO NOTHING;

DELETE FROM public.hotel_bookings hb
USING public.hotel_booking_duplicate_repairs repair
WHERE hb.id = repair.original_id;

CREATE UNIQUE INDEX IF NOT EXISTS hotel_bookings_one_own_hotel_per_booking
ON public.hotel_bookings(booking_id) WHERE own_hotel_id IS NOT NULL;

DO $$ DECLARE repaired_booking uuid; BEGIN
  FOR repaired_booking IN SELECT DISTINCT booking_id FROM public.hotel_booking_duplicate_repairs LOOP
    PERFORM public.recalculate_payment_totals_for_booking(repaired_booking);
  END LOOP;
END $$;
COMMIT;
