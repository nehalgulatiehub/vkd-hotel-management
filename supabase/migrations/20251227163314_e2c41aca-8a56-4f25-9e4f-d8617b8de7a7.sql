-- Drop the function that depends on the enum first
DROP FUNCTION IF EXISTS public.has_module_access(UUID, app_module);

-- Drop the old module assignments table
DROP TABLE IF EXISTS public.user_module_assignments;

-- Drop the old enum
DROP TYPE IF EXISTS public.app_module CASCADE;

-- Create new table for granular menu permissions
CREATE TABLE public.user_menu_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    menu_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, menu_key)
);

-- Enable RLS
ALTER TABLE public.user_menu_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin and account can view all permissions"
ON public.user_menu_permissions
FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'account'::app_role) OR
    user_id = auth.uid()
);

CREATE POLICY "Admin and account can manage permissions"
ON public.user_menu_permissions
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'account'::app_role)
);

-- Create function to check menu access
CREATE OR REPLACE FUNCTION public.has_menu_access(_user_id UUID, _menu_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin and Account always have full access
    has_role(_user_id, 'admin'::app_role) OR 
    has_role(_user_id, 'account'::app_role) OR
    -- Check specific menu permission
    EXISTS (
      SELECT 1
      FROM public.user_menu_permissions
      WHERE user_id = _user_id AND menu_key = _menu_key
    )
$$;