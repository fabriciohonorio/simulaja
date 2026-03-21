-- Drop existing restrictive policies if necessary (to prevent conflicts)
DROP POLICY IF EXISTS "Permitir select anonimo em convites pendentes" ON public.convites;
DROP POLICY IF EXISTS "Permitir select anonimo em orgs" ON public.organizacoes;

-- Enable public read for invitations (so non-logged users can see "who invited them" and "if the invite is valid")
CREATE POLICY "Permitir select anonimo em convites pendentes"
ON public.convites
FOR SELECT
USING (status = 'pendente');

-- Enable public read for organizations (so the invite page can display the organization name)
CREATE POLICY "Permitir select anonimo em orgs"
ON public.organizacoes
FOR SELECT
USING (true);
