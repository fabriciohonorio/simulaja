-- Habilitar inserção de novas organizações por usuários autenticados
DROP POLICY IF EXISTS "Organizações - Inserção por autenticados" ON public.organizacoes;
CREATE POLICY "Organizações - Inserção por autenticados" ON public.organizacoes
FOR INSERT TO authenticated
WITH CHECK (true);

-- Garantir que qualquer um possa ver os nomes das organizações (necessário para convites)
DROP POLICY IF EXISTS "Organizações - Select público limitado" ON public.organizacoes;
CREATE POLICY "Organizações - Select público limitado" ON public.organizacoes
FOR SELECT TO anon, authenticated
USING (true);

-- Convites: Permitir que usuários anônimos vejam o convite se tiverem o token
DROP POLICY IF EXISTS "Convites - Select por token" ON public.convites;
CREATE POLICY "Convites - Select por token" ON public.convites
FOR SELECT TO anon, authenticated
USING (status = 'pendente');

-- Convites: Permitir Update (aceitar convite)
DROP POLICY IF EXISTS "Convites - Update status" ON public.convites;
CREATE POLICY "Convites - Update status" ON public.convites
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (status IN ('aceito', 'expirado', 'pendente'));
