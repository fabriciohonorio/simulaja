-- 1. LIMPEZA TOTAL DE POLÍTICAS ANTIGAS NA TABELA LEADS
-- Isso garante que nenhuma política "esquecida" dê acesso extra.
DO $$ 
DECLARE 
    pol text;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', pol);
    END LOOP;
END $$;

-- 2. GARANTIR RLS ATIVO E FORÇADO
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- 3. POLÍTICA ÚNICA E DEFINITIVA DE VISUALIZAÇÃO (SELECT)
-- Regra: Admin/Manager vê tudo da Org. Vendedor vê apenas os próprios leads.
CREATE POLICY "Leads - Acesso Controlado" ON public.leads
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfis p
    WHERE p.id = auth.uid()
    AND p.organizacao_id = leads.organizacao_id -- Deve ser da mesma org
    AND (
      p.tipo_acesso IN ('admin', 'manager') -- Admins e Managers vêem tudo
      OR leads.responsavel_id = auth.uid()   -- Vendedor vê só o dele
    )
  )
);

-- 4. POLÍTICA DE EDIÇÃO (UPDATE)
-- Regra: Mesma lógica do Select.
CREATE POLICY "Leads - Edição Controlada" ON public.leads
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfis p
    WHERE p.id = auth.uid()
    AND p.organizacao_id = leads.organizacao_id
    AND (
      p.tipo_acesso IN ('admin', 'manager')
      OR leads.responsavel_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.perfis p
    WHERE p.id = auth.uid()
    AND p.organizacao_id = leads.organizacao_id
    AND (
      p.tipo_acesso IN ('admin', 'manager')
      OR leads.responsavel_id = auth.uid()
    )
  )
);

-- 5. POLÍTICA DE INSERÇÃO (INSERT)
-- Usuários autenticados podem inserir leads para sua própria org.
CREATE POLICY "Leads - Inserção Autenticada" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1));

-- Simulador (anônimo) continua podendo inserir
CREATE POLICY "Leads - Inserção Pública" ON public.leads
FOR INSERT TO anon
WITH CHECK (true);

-- 6. LIMPEZA DE LEADS ÓRFÃOS (REFORÇO)
-- Garante que nenhum lead fique sem dono (manda pro admin)
UPDATE public.leads 
SET responsavel_id = (SELECT id FROM public.perfis WHERE tipo_acesso = 'admin' LIMIT 1)
WHERE responsavel_id IS NULL;
