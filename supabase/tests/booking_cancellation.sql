-- Run using: supabase db query --linked --file supabase/tests/booking_cancellation.sql
-- Actual function body, redirected to temporary tables; no live reservations change.
BEGIN;
CREATE TEMP TABLE test_cancel_bookings (
  id uuid PRIMARY KEY, status text NOT NULL, created_by uuid, paid_amount numeric,
  total_amount numeric, updated_at timestamptz
);
CREATE TEMP TABLE test_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid,
  cancelled_by uuid, cancellation_date date, cancellation_reason text,
  cancellation_charges numeric, refund_amount numeric, created_at timestamptz DEFAULT now()
);
DO $$ DECLARE definition text; BEGIN
  ASSERT NOT has_function_privilege('anon', 'public.cancel_booking(uuid,numeric,text,numeric)', 'EXECUTE');
  ASSERT has_function_privilege('authenticated', 'public.cancel_booking(uuid,numeric,text,numeric)', 'EXECUTE');
  definition := pg_get_functiondef('public.cancel_booking(uuid,numeric,text,numeric)'::regprocedure);
  definition := replace(definition, 'public.cancel_booking', 'pg_temp.test_cancel_booking');
  definition := replace(definition, 'public.bookings', 'pg_temp.test_cancel_bookings');
  definition := replace(definition, 'public.cancellations', 'pg_temp.test_cancellations');
  EXECUTE definition;
END $$;
CREATE FUNCTION pg_temp.test_cancel_update_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.id = '00000000-0000-0000-0000-000000000099' THEN RAISE EXCEPTION 'Simulated status update failure'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER simulate_status_failure BEFORE UPDATE ON test_cancel_bookings
FOR EACH ROW EXECUTE FUNCTION pg_temp.test_cancel_update_failure();

DO $$ <<test_case>> DECLARE owner_id uuid := gen_random_uuid(); outsider uuid := gen_random_uuid();
  booking_id uuid := gen_random_uuid(); zero_id uuid := gen_random_uuid(); admin_id uuid;
  admin_booking uuid := gen_random_uuid(); first_id uuid; repeated_id uuid;
BEGIN
  INSERT INTO test_cancel_bookings VALUES (booking_id, 'confirmed', owner_id, 500, 900, now()),
    (zero_id, 'confirmed', owner_id, 0, 0, now()),
    (admin_booking, 'confirmed', owner_id, 500, 900, now()),
    ('00000000-0000-0000-0000-000000000099', 'confirmed', owner_id, 0, 10, now());
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM pg_temp.test_cancel_booking(booking_id);
    RAISE EXCEPTION 'Anonymous cancellation allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Please sign in again' THEN RAISE; END IF;
  END;
  PERFORM set_config('request.jwt.claim.sub', outsider::text, true);
  BEGIN
    PERFORM pg_temp.test_cancel_booking(booking_id);
    RAISE EXCEPTION 'Other user cancellation allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'You can only cancel bookings you created' THEN RAISE; END IF;
  END;
  PERFORM set_config('request.jwt.claim.sub', owner_id::text, true);
  BEGIN
    PERFORM pg_temp.test_cancel_booking(booking_id, -1);
    RAISE EXCEPTION 'Negative charge allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Enter a valid non-negative cancellation charge' THEN RAISE; END IF;
  END;
  first_id := pg_temp.test_cancel_booking(booking_id, 100, 'Duplicate booking');
  repeated_id := pg_temp.test_cancel_booking(booking_id, 100, 'Repeated click');
  ASSERT first_id = repeated_id, 'Repeated request not idempotent';
  ASSERT (SELECT count(*) FROM test_cancellations c WHERE c.booking_id = test_case.booking_id) = 1;
  ASSERT (SELECT status FROM test_cancel_bookings WHERE id = booking_id) = 'cancelled';
  ASSERT (SELECT total_amount FROM test_cancel_bookings WHERE id = booking_id) = 900;
  ASSERT (SELECT refund_amount FROM test_cancellations WHERE id = first_id) = 400;
  ASSERT (SELECT cancelled_by FROM test_cancellations WHERE id = first_id) = owner_id;
  PERFORM pg_temp.test_cancel_booking(zero_id, 0, 'Zero price duplicate', 0);
  ASSERT (SELECT status FROM test_cancel_bookings WHERE id = zero_id) = 'cancelled';
  BEGIN
    PERFORM pg_temp.test_cancel_booking('00000000-0000-0000-0000-000000000099');
    RAISE EXCEPTION 'Simulated failure missing';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Simulated status update failure' THEN RAISE; END IF;
  END;
  ASSERT NOT EXISTS (SELECT 1 FROM test_cancellations c WHERE c.booking_id = '00000000-0000-0000-0000-000000000099'), 'Partial cancellation persisted';
  ASSERT (SELECT status FROM test_cancel_bookings WHERE id = '00000000-0000-0000-0000-000000000099') = 'confirmed';
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  ASSERT admin_id IS NOT NULL, 'Admin permission test needs an admin';
  PERFORM set_config('request.jwt.claim.sub', admin_id::text, true);
  PERFORM pg_temp.test_cancel_booking(admin_booking);
  ASSERT (SELECT status FROM test_cancel_bookings WHERE id = admin_booking) = 'cancelled';
END $$;
ROLLBACK;
SELECT 'PASS: owner/admin permissions, anonymous/other-user rejection, charge validation, refund calculation, zero-value duplicates, repeated requests and atomic rollback; temporary tables only' AS result;
