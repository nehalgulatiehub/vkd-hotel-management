
-- Add plain_password column to profiles for admin viewing (NOT SECURE - per user request)
ALTER TABLE public.profiles ADD COLUMN plain_password text;

-- Allow admins/accounts to read plain_password
-- The existing RLS policies on profiles should cover this since admins can already read profiles
