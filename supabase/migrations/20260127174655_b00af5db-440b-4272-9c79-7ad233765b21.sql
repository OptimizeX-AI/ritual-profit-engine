-- Create enum for member roles/functions
CREATE TYPE public.member_function AS ENUM ('assistente', 'closer', 'gestor', 'dono');

-- Add function field to profiles
ALTER TABLE public.profiles 
ADD COLUMN member_function public.member_function DEFAULT 'assistente',
ADD COLUMN avatar_url TEXT;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update profiles_public view to include new fields (but still exclude custo_hora_centavos)
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_invoker=on) AS
SELECT 
  id, 
  name, 
  organization_id, 
  created_at,
  member_function,
  avatar_url,
  weekly_capacity_hours
FROM public.profiles;

-- Function to check access level based on member function
CREATE OR REPLACE FUNCTION public.get_member_function(_user_id uuid)
RETURNS public.member_function
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT member_function FROM public.profiles WHERE id = _user_id
$$;

-- Function to check if user can access financial data (gestor or dono only)
CREATE OR REPLACE FUNCTION public.can_access_financeiro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.has_role(_user_id, 'admin') 
    OR (SELECT member_function FROM public.profiles WHERE id = _user_id) IN ('gestor', 'dono')
  )
$$;

-- Function to check if user can access war room (closer, gestor, dono)
CREATE OR REPLACE FUNCTION public.can_access_warroom(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.has_role(_user_id, 'admin') 
    OR (SELECT member_function FROM public.profiles WHERE id = _user_id) IN ('closer', 'gestor', 'dono')
  )
$$;