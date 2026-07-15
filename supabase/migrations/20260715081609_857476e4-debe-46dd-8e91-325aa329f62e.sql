CREATE OR REPLACE FUNCTION public.can_approve_payment(_user_id uuid, _payment_mode text, _city_name text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    has_role(_user_id, 'admin'::app_role) OR
    (
      has_role(_user_id, 'account'::app_role) AND NOT (
        LOWER(COALESCE(_payment_mode, '')) = 'cash'
        AND LOWER(COALESCE(_city_name, '')) = 'delhi'
      )
    )
$function$;