
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'vendedor');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS on user_roles: only admins can read
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix leads: remove public SELECT, keep public INSERT, add authenticated SELECT
DROP POLICY IF EXISTS "Allow public select on leads" ON public.leads;
DROP POLICY IF EXISTS "Permitir leitura própria de leads" ON public.leads;

CREATE POLICY "Authenticated users can read leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update leads (for kanban status changes)
CREATE POLICY "Authenticated users can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS policies for propostas
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read propostas"
  ON public.propostas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert propostas"
  ON public.propostas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update propostas"
  ON public.propostas FOR UPDATE
  TO authenticated
  USING (true);

-- RLS policies for usuarios (restrict to admins)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view usuarios"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for interacoes
CREATE POLICY "Authenticated users can read interacoes"
  ON public.interacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert interacoes"
  ON public.interacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);
