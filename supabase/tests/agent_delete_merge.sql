BEGIN;
DO $$ BEGIN
  ASSERT NOT has_function_privilege('anon', 'public.delete_or_merge_agent(uuid,uuid)', 'EXECUTE'), 'Anonymous execute grant';
  ASSERT has_function_privilege('authenticated', 'public.delete_or_merge_agent(uuid,uuid)', 'EXECUTE'), 'Missing authenticated execute grant';
END $$;
CREATE TEMP TABLE agent_test_agents (id uuid PRIMARY KEY, created_by uuid);
CREATE TEMP TABLE agent_test_bookings (id uuid PRIMARY KEY, agent_id uuid REFERENCES agent_test_agents(id));
CREATE TEMP TABLE agent_test_enquiries (id uuid PRIMARY KEY, agent_id uuid REFERENCES agent_test_agents(id));
DO $$
DECLARE definition text;
BEGIN
  definition := pg_get_functiondef('public.delete_or_merge_agent(uuid,uuid)'::regprocedure);
  definition := replace(definition, 'public.delete_or_merge_agent', 'pg_temp.test_delete_or_merge_agent');
  definition := replace(definition, 'public.agents', 'pg_temp.agent_test_agents');
  definition := replace(definition, 'public.bookings', 'pg_temp.agent_test_bookings');
  definition := replace(definition, 'public.enquiries', 'pg_temp.agent_test_enquiries');
  EXECUTE definition;
  definition := pg_get_functiondef('public.get_agent_usage(uuid)'::regprocedure);
  definition := replace(definition, 'public.get_agent_usage', 'pg_temp.test_get_agent_usage');
  definition := replace(definition, 'public.agents', 'pg_temp.agent_test_agents');
  definition := replace(definition, 'public.bookings', 'pg_temp.agent_test_bookings');
  definition := replace(definition, 'public.enquiries', 'pg_temp.agent_test_enquiries');
  EXECUTE definition;
END $$;
DO $$
DECLARE actor uuid; source_id uuid := gen_random_uuid(); target_id uuid := gen_random_uuid(); empty_id uuid := gen_random_uuid(); outsider uuid := gen_random_uuid(); usage record;
BEGIN
  SELECT user_id INTO actor FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF actor IS NULL THEN RAISE EXCEPTION 'No admin available for permission test'; END IF;
  PERFORM set_config('request.jwt.claim.sub', actor::text, true);
  INSERT INTO agent_test_agents VALUES (source_id, actor), (target_id, actor), (empty_id, actor);
  INSERT INTO agent_test_bookings VALUES (gen_random_uuid(), source_id), (gen_random_uuid(), target_id);
  INSERT INTO agent_test_enquiries VALUES (gen_random_uuid(), source_id);
  SELECT * INTO usage FROM pg_temp.test_get_agent_usage(source_id);
  ASSERT usage.booking_count = 1 AND usage.enquiry_count = 1, 'Incorrect usage counts';
  BEGIN
    PERFORM pg_temp.test_delete_or_merge_agent(source_id);
    RAISE EXCEPTION 'Linked deletion incorrectly allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'This agent has linked%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM pg_temp.test_delete_or_merge_agent(source_id, source_id);
    RAISE EXCEPTION 'Self merge incorrectly allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Choose a different agent to keep' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM pg_temp.test_delete_or_merge_agent(source_id, gen_random_uuid());
    RAISE EXCEPTION 'Missing target incorrectly allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'The agent to keep no longer exists' THEN RAISE; END IF;
  END;
  PERFORM set_config('request.jwt.claim.sub', outsider::text, true);
  BEGIN
    PERFORM pg_temp.test_delete_or_merge_agent(source_id, target_id);
    RAISE EXCEPTION 'Unauthorized merge incorrectly allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'You do not have permission to manage this agent' THEN RAISE; END IF;
  END;
  PERFORM set_config('request.jwt.claim.sub', actor::text, true);
  PERFORM pg_temp.test_delete_or_merge_agent(source_id, target_id);
  ASSERT NOT EXISTS (SELECT 1 FROM agent_test_agents WHERE id=source_id), 'Duplicate not deleted';
  ASSERT (SELECT count(*) FROM agent_test_bookings WHERE agent_id=target_id)=2, 'Booking links not preserved';
  ASSERT (SELECT count(*) FROM agent_test_enquiries WHERE agent_id=target_id)=1, 'Enquiry links not preserved';
  PERFORM pg_temp.test_delete_or_merge_agent(empty_id);
  ASSERT NOT EXISTS (SELECT 1 FROM agent_test_agents WHERE id=empty_id), 'Unused agent not deleted';
END $$;
ROLLBACK;
SELECT 'PASS: usage counts, linked-delete protection, self-merge, stale target, unauthorized access, atomic merge, unused deletion; only temporary tables used' AS result;
