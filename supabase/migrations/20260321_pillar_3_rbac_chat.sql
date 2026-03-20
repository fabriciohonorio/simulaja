-- =====================================================
-- PILLAR 3: RBAC + LEAD ASSIGNMENT + TEAM CHAT
-- =====================================================

-- 1. Garantir coluna tipo_acesso em perfis com enum correto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfis' AND column_name = 'tipo_acesso'
  ) THEN
    ALTER TABLE public.perfis ADD COLUMN tipo_acesso text NOT NULL DEFAULT 'vendedor';
  END IF;
END $$;

-- Constraint de valores válidos
ALTER TABLE public.perfis 
  DROP CONSTRAINT IF EXISTS perfis_tipo_acesso_check;
ALTER TABLE public.perfis 
  ADD CONSTRAINT perfis_tipo_acesso_check 
  CHECK (tipo_acesso IN ('admin', 'manager', 'vendedor'));

-- 2. Coluna responsavel_id em leads (parece que a tabela é pública)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'responsavel_id'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index para consultas por responsavel
CREATE INDEX IF NOT EXISTS idx_leads_responsavel_id ON public.leads(responsavel_id);

-- 3. Tabela de mensagens (chat interno)
CREATE TABLE IF NOT EXISTS public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  remetente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destinatario_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = broadcast para org
  mensagem text NOT NULL CHECK (length(mensagem) > 0 AND length(mensagem) < 2000),
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_org ON public.mensagens(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_dest ON public.mensagens(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON public.mensagens(remetente_id);

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- RLS: membro vê mensagens da sua org (enviadas por ele, para ele, ou broadcast)
DROP POLICY IF EXISTS "Mensagens - Select" ON public.mensagens;
CREATE POLICY "Mensagens - Select" ON public.mensagens
  FOR SELECT TO authenticated
  USING (
    organizacao_id = (
      SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1
    )
    AND (
      destinatario_id = auth.uid()
      OR remetente_id = auth.uid()
      OR destinatario_id IS NULL
    )
  );

DROP POLICY IF EXISTS "Mensagens - Insert" ON public.mensagens;
CREATE POLICY "Mensagens - Insert" ON public.mensagens
  FOR INSERT TO authenticated
  WITH CHECK (
    remetente_id = auth.uid()
    AND organizacao_id = (
      SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1
    )
  );

DROP POLICY IF EXISTS "Mensagens - Update lida" ON public.mensagens;
CREATE POLICY "Mensagens - Update lida" ON public.mensagens
  FOR UPDATE TO authenticated
  USING (destinatario_id = auth.uid())
  WITH CHECK (true);

-- 4. Habilitar Realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;

-- 5. RLS para leads: vendedor só vê os seus + não atribuídos
-- Primeiro remover policies existentes para leads
DROP POLICY IF EXISTS "Leads - Select vendedor" ON public.leads;
DROP POLICY IF EXISTS "Leads - Select todos" ON public.leads;

-- Manager/Admin vê todos; Vendedor vê só os seus ou não atribuídos
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
        OR leads.responsavel_id IS NULL
      )
    )
  );

-- 6. Função para atualizar cargo (só admin pode)
CREATE OR REPLACE FUNCTION public.update_member_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT tipo_acesso INTO caller_role FROM public.perfis WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar cargos.';
  END IF;
  IF new_role NOT IN ('admin', 'manager', 'vendedor') THEN
    RAISE EXCEPTION 'Cargo inválido.';
  END IF;
  UPDATE public.perfis SET tipo_acesso = new_role WHERE id = target_user_id;
END;
$$;
