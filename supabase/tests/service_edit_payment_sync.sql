-- Exercise deployed functions and trigger definitions against temporary tables.
BEGIN;
CREATE TEMP TABLE test_bookings(id uuid PRIMARY KEY, total_amount numeric, paid_amount numeric, due_amount numeric, payment_status public.payment_status, updated_at timestamptz);
CREATE TEMP TABLE test_payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid, amount numeric, payment_type text);
DO $$ DECLARE service_table text; definition text; source_table text; BEGIN
  FOREACH service_table IN ARRAY ARRAY['hotel_bookings', 'safari_bookings', 'vehicle_bookings', 'volvo_bookings', 'visa_bookings', 'cruise_bookings'] LOOP
    EXECUTE format('CREATE TEMP TABLE %I (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid, total_amount numeric, paid_amount numeric DEFAULT 0, due_amount numeric, updated_at timestamptz, hotel_id uuid, own_hotel_id uuid, route text)', 'test_' || service_table);
  END LOOP;
  definition := pg_get_functiondef('public.recalculate_payment_totals_for_booking(uuid)'::regprocedure);
  definition := replace(definition, 'public.recalculate_payment_totals_for_booking', 'pg_temp.test_recalculate');
  FOREACH source_table IN ARRAY ARRAY['bookings', 'payments', 'hotel_bookings', 'safari_bookings', 'vehicle_bookings', 'volvo_bookings', 'visa_bookings', 'cruise_bookings'] LOOP
    definition := replace(definition, 'public.' || source_table, 'pg_temp.test_' || source_table);
  END LOOP;
  EXECUTE definition;
  definition := pg_get_functiondef('public.sync_booking_payment_totals()'::regprocedure);
  definition := replace(definition, 'public.sync_booking_payment_totals', 'pg_temp.test_sync');
  definition := replace(definition, 'public.recalculate_payment_totals_for_booking', 'pg_temp.test_recalculate');
  EXECUTE definition;
  FOREACH service_table IN ARRAY ARRAY['hotel_bookings', 'safari_bookings', 'vehicle_bookings', 'volvo_bookings', 'visa_bookings', 'cruise_bookings', 'payments'] LOOP
    SELECT pg_get_triggerdef(oid) INTO definition FROM pg_trigger
      WHERE tgrelid = ('public.' || service_table)::regclass AND tgname =
        CASE WHEN service_table = 'payments' THEN 'payments_sync_booking_totals' ELSE 'service_sync_payment_totals' END;
    ASSERT definition IS NOT NULL, 'Missing synchronization trigger';
    definition := replace(definition, 'public.' || service_table, 'pg_temp.test_' || service_table);
    definition := replace(definition, 'public.sync_booking_payment_totals', 'pg_temp.test_sync');
    definition := replace(definition, 'EXECUTE FUNCTION sync_booking_payment_totals()', 'EXECUTE FUNCTION pg_temp.test_sync()');
    ASSERT position('EXECUTE FUNCTION pg_temp.test_sync()' IN definition) > 0, 'Trigger must use isolated test function';
    EXECUTE definition;
  END LOOP;
END $$;

DO $$ DECLARE booking_a uuid := gen_random_uuid(); booking_b uuid := gen_random_uuid();
  vehicle_id uuid := gen_random_uuid(); hotel_row uuid := gen_random_uuid(); route_row uuid := gen_random_uuid(); BEGIN
  INSERT INTO test_bookings VALUES (booking_a, 210375, 0, 210375, 'pending', now()), (booking_b, 1000, 0, 1000, 'pending', now());
  -- Payments already exist when an edit replaces the service rows.
  INSERT INTO test_payments(booking_id, amount, payment_type) VALUES
    (booking_a, 97500, 'vehicle'), (booking_a, 2000, 'hotel_direct'),
    (booking_a, 3000, 'safari_direct'), (booking_a, 4000, 'volvo_dm'),
    (booking_a, 5000, 'manali_delhi'), (booking_a, 6000, 'visa'), (booking_a, 7000, 'cruise');
  INSERT INTO test_vehicle_bookings(id, booking_id, total_amount, due_amount) VALUES (vehicle_id, booking_a, 97500, 97500);
  INSERT INTO test_hotel_bookings(id, booking_id, total_amount, due_amount, hotel_id) VALUES (hotel_row, booking_a, 112875, 112875, gen_random_uuid());
  INSERT INTO test_safari_bookings(booking_id, total_amount, due_amount) VALUES (booking_a, 6000, 6000);
  INSERT INTO test_volvo_bookings(booking_id, total_amount, due_amount, route) VALUES (booking_a, 8000, 8000, 'delhi_manali'), (booking_a, 10000, 10000, 'manali_delhi');
  INSERT INTO test_visa_bookings(booking_id, total_amount, due_amount) VALUES (booking_a, 12000, 12000);
  INSERT INTO test_cruise_bookings(booking_id, total_amount, due_amount) VALUES (booking_a, 14000, 14000);
  ASSERT (SELECT paid_amount = 97500 AND due_amount = 0 FROM test_vehicle_bookings WHERE id = vehicle_id), 'Vehicle insert lost payment';
  ASSERT (SELECT paid_amount = 2000 AND due_amount = 110875 FROM test_hotel_bookings WHERE id = hotel_row), 'Hotel insert lost payment or leaked vehicle payment';
  ASSERT (SELECT paid_amount = 3000 AND due_amount = 3000 FROM test_safari_bookings WHERE booking_id = booking_a), 'Safari insert lost payment';
  ASSERT (SELECT paid_amount = 4000 AND due_amount = 4000 FROM test_volvo_bookings WHERE route = 'delhi_manali'), 'D-M Volvo mismatch';
  ASSERT (SELECT paid_amount = 5000 AND due_amount = 5000 FROM test_volvo_bookings WHERE route = 'manali_delhi'), 'M-D Volvo mismatch';
  ASSERT (SELECT paid_amount = 6000 AND due_amount = 6000 FROM test_visa_bookings WHERE booking_id = booking_a), 'Visa mismatch';
  ASSERT (SELECT paid_amount = 7000 AND due_amount = 7000 FROM test_cruise_bookings WHERE booking_id = booking_a), 'Cruise mismatch';
  ASSERT (SELECT paid_amount = 124500 AND due_amount = 85875 FROM test_bookings WHERE id = booking_a), 'Parent totals mismatch';

  DELETE FROM test_vehicle_bookings WHERE id = vehicle_id;
  vehicle_id := gen_random_uuid();
  INSERT INTO test_vehicle_bookings(id, booking_id, total_amount, due_amount) VALUES (vehicle_id, booking_a, 97500, 97500);
  ASSERT (SELECT paid_amount = 97500 AND due_amount = 0 FROM test_vehicle_bookings WHERE id = vehicle_id), 'Delete/reinsert reset received';
  UPDATE test_vehicle_bookings SET total_amount = 110000 WHERE id = vehicle_id;
  ASSERT (SELECT paid_amount = 97500 AND due_amount = 12500 FROM test_vehicle_bookings WHERE id = vehicle_id), 'Price edit failed to update due';
  UPDATE test_vehicle_bookings SET booking_id = booking_b WHERE id = vehicle_id;
  ASSERT (SELECT paid_amount = 0 AND due_amount = 110000 FROM test_vehicle_bookings WHERE id = vehicle_id), 'Moved service retained old booking payments';
  ASSERT (SELECT count(*) FROM test_payments) = 7, 'Payment records changed';

  INSERT INTO test_payments(booking_id, amount, payment_type) VALUES (booking_b, 100, 'delhi_manali'), (booking_b, 200, 'volvo_md');
  INSERT INTO test_volvo_bookings(id, booking_id, total_amount, due_amount, route) VALUES (route_row, booking_b, 500, 500, 'delhi_manali');
  ASSERT (SELECT paid_amount = 100 FROM test_volvo_bookings WHERE id = route_row);
  UPDATE test_volvo_bookings SET route = 'manali_delhi' WHERE id = route_row;
  ASSERT (SELECT paid_amount = 200 AND due_amount = 300 FROM test_volvo_bookings WHERE id = route_row), 'Changed Volvo route used wrong payments';
END $$;
ROLLBACK;
SELECT 'PASS: all service categories, payment isolation, edit delete/reinsert, price changes, booking reassignment, Volvo route changes, no recursion or payment mutation; temporary tables only' AS result;
