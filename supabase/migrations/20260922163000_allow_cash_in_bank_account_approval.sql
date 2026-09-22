-- Cash in Bank is already deposited and can be approved by account users.
-- Only physical cash remains subject to the account approval restriction.
CREATE OR REPLACE FUNCTION public.can_approve_payment(_user_id uuid, _payment_mode text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    has_role(_user_id, 'admin'::app_role) OR
    (
      has_role(_user_id, 'account'::app_role) AND
      LOWER(TRIM(COALESCE(_payment_mode, ''))) NOT IN ('cash', 'cash in hand')
    )
$function$;

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
        LOWER(TRIM(COALESCE(_payment_mode, ''))) IN ('cash', 'cash in hand')
        AND LOWER(TRIM(COALESCE(_city_name, ''))) = 'delhi'
      )
    )
$function$;
