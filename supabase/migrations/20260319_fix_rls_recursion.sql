-- Fix for infinite recursion in perfis table RLS policies
-- This uses a SECURITY DEFINER function to bypass the recursion limit

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid());
END;
$$;

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can see their own profile" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem ver perfis da mesma organização" ON public.perfis;
DROP POLICY IF EXISTS "Perfil - Acesso Seguro" ON public.perfis;

-- Create new non-recursive policy
CREATE POLICY "Perfil - Acesso Seguro" ON public.perfis
FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR 
  organizacao_id = public.get_my_org_id()
);

-- Ensure historico_contatos also uses the safe check if needed
DROP POLICY IF EXISTS "Authenticated can insert historico" ON public.historico_contatos;
CREATE POLICY "Authenticated can insert historico" ON public.historico_contatos
FOR INSERT TO authenticated
WITH CHECK (
  organizacao_id = public.get_my_org_id()
);
