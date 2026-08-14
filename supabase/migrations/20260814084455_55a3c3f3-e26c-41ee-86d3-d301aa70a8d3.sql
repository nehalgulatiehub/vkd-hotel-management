CREATE OR REPLACE FUNCTION public.get_email_by_username(_username text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT u.email
  FROM auth.users u
  INNER JOIN public.profiles p ON u.id = p.id
  WHERE LOWER(TRIM(p.username)) = LOWER(TRIM(_username))
  LIMIT 1
$function$;

UPDATE public.profiles SET username = TRIM(username) WHERE username IS NOT NULL AND username <> TRIM(username);