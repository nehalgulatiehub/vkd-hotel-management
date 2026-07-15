ALTER TABLE public.user_menu_permissions
  DROP CONSTRAINT IF EXISTS user_menu_permissions_user_id_fkey;

ALTER TABLE public.user_menu_permissions
  ADD CONSTRAINT user_menu_permissions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.has_menu_access(_user_id uuid, _menu_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.user_menu_permissions
      WHERE user_id = _user_id
        AND menu_key = _menu_key
    )
$function$;