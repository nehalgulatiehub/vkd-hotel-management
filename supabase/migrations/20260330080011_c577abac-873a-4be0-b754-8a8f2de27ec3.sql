
CREATE TABLE public.account_city_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, city_id)
);

ALTER TABLE public.account_city_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage city restrictions"
ON public.account_city_restrictions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view city restrictions"
ON public.account_city_restrictions
FOR SELECT
TO authenticated
USING (true);
