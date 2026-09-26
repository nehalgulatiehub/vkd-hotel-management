-- Preserve booking/enquiry history when removing a duplicate agent.
CREATE OR REPLACE FUNCTION public.get_agent_usage(p_agent_id uuid)
RETURNS TABLE(booking_count bigint, enquiry_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE agent_owner uuid;
BEGIN
  SELECT created_by INTO agent_owner FROM public.agents WHERE id = p_agent_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Agent no longer exists'; END IF;
  IF auth.uid() IS NULL OR NOT (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'account') OR
    public.has_role(auth.uid(), 'manager') OR agent_owner = auth.uid()
  ) IS TRUE THEN RAISE EXCEPTION 'You do not have permission to manage this agent'; END IF;
  RETURN QUERY SELECT
    (SELECT count(*) FROM public.bookings WHERE agent_id = p_agent_id),
    (SELECT count(*) FROM public.enquiries WHERE agent_id = p_agent_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_or_merge_agent(p_agent_id uuid, p_replacement_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE agent_owner uuid; replacement_owner uuid; privileged boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in again'; END IF;
  IF p_agent_id = p_replacement_id THEN RAISE EXCEPTION 'Choose a different agent to keep'; END IF;
  -- Stable locking order also prevents new foreign-key references during deletion.
  PERFORM id FROM public.agents WHERE id IN (p_agent_id, p_replacement_id) ORDER BY id FOR UPDATE;
  SELECT created_by INTO agent_owner FROM public.agents WHERE id = p_agent_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Agent no longer exists'; END IF;
  privileged := public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'account') OR public.has_role(auth.uid(), 'manager');
  IF NOT (privileged OR agent_owner = auth.uid()) IS TRUE THEN
    RAISE EXCEPTION 'You do not have permission to manage this agent';
  END IF;
  IF p_replacement_id IS NOT NULL THEN
    SELECT created_by INTO replacement_owner FROM public.agents WHERE id = p_replacement_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'The agent to keep no longer exists'; END IF;
    IF NOT (privileged OR replacement_owner = auth.uid()) IS TRUE THEN
      RAISE EXCEPTION 'You do not have permission to merge into this agent';
    END IF;
    UPDATE public.bookings SET agent_id = p_replacement_id WHERE agent_id = p_agent_id;
    UPDATE public.enquiries SET agent_id = p_replacement_id WHERE agent_id = p_agent_id;
  ELSIF EXISTS (SELECT 1 FROM public.bookings WHERE agent_id = p_agent_id)
     OR EXISTS (SELECT 1 FROM public.enquiries WHERE agent_id = p_agent_id) THEN
    RAISE EXCEPTION 'This agent has linked bookings or enquiries. Choose the duplicate agent to keep and merge first.';
  END IF;
  DELETE FROM public.agents WHERE id = p_agent_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_agent_usage(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_or_merge_agent(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_agent_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_or_merge_agent(uuid, uuid) TO authenticated;
