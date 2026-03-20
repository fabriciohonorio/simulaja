/* 1: Drop problematic policies */
DROP POLICY IF EXISTS "Perfil - Acesso Seguro" ON public.perfis;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem ver perfis da mesma organização" ON public.perfis;

/* 2: Robust get_my_org_id function */
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organizacao_id FROM perfis WHERE id = auth.uid();
$$;

/* 3: New non-recursive policies for perfis */
CREATE POLICY "Perfil - Ver próprio" ON public.perfis
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Perfil - Ver mesma organização" ON public.perfis
FOR SELECT TO authenticated
USING (
  organizacao_id = (
    SELECT p.organizacao_id 
    FROM public.perfis p 
    WHERE p.id = auth.uid()
  )
);

/* 4: Secure historico_contatos insert policy */
DROP POLICY IF EXISTS "Authenticated can insert historico" ON public.historico_contatos;
CREATE POLICY "Authenticated can insert historico" ON public.historico_contatos
FOR INSERT TO authenticated
WITH CHECK (
  organizacao_id = public.get_my_org_id()
);

/* 5: Permissions */
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO service_role;
