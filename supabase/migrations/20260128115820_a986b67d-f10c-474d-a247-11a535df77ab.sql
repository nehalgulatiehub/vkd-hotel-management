-- Auto-set created_by on insert so UI can always resolve the creator username

CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

-- Attach to all public tables that have a created_by column
DO $$
DECLARE
  r record;
  trig_name text;
BEGIN
  FOR r IN (
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'created_by'
    order by table_name
  ) LOOP
    trig_name := 'trg_set_created_by_' || r.table_name;

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', trig_name, r.table_name);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_created_by();',
      trig_name,
      r.table_name
    );
  END LOOP;
END;
$$;