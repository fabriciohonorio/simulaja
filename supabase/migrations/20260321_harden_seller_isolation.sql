-- 1. Reforçar o isolamento de leads para vendedores
-- Um vendedor deve ver APENAS os leads onde ele é o responsável.
-- Removendo o "OR leads.responsavel_id IS NULL" que estava causando o vazamento de dados.

DROP POLICY IF EXISTS "Leads - Select por role" ON public.leads;

CREATE POLICY "Leads - Select por role" ON public.leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfis p
      WHERE p.id = auth.uid()
      AND p.organizacao_id IS NOT NULL
      AND (
        p.tipo_acesso IN ('admin', 'manager')
        OR leads.responsavel_id = auth.uid()
      )
    )
  );

-- 2. Corrigir permissões de UPDATE para leads
-- Vendedor só pode alterar os SEUS leads
DROP POLICY IF EXISTS "Leads - Update por role" ON public.leads;
CREATE POLICY "Leads - Update por role" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfis p
      WHERE p.id = auth.uid()
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
      AND (
        p.tipo_acesso IN ('admin', 'manager')
        OR leads.responsavel_id = auth.uid()
      )
    )
  );

-- 3. Garantir que o nome da Doris (ou qualquer novo usuário) esteja atualizado no Perfil
-- Se o usuário confirmou e-mail mas o nome sumiu, forçamos a atualização baseada nos metadados
UPDATE public.perfis
SET nome_completo = COALESCE(nome_completo, (SELECT raw_user_meta_data->>'nome_completo' FROM auth.users WHERE id = perfis.id))
WHERE nome_completo IS NULL OR nome_completo = '';
