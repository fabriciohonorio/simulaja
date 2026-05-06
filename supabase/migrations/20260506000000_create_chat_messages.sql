-- Migração: Criação de estrutura para Atendimento via IA

-- 1. Adicionar coluna atendimento_ia na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS atendimento_ia BOOLEAN DEFAULT true;

-- 2. Criar tabela de histórico de mensagens do chat (chat_messages)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS na nova tabela
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança (RLS) para chat_messages
-- Todos os usuários autenticados da mesma organização do lead podem ver e inserir mensagens.
CREATE POLICY "Usuários podem ver mensagens dos leads da sua organização" 
ON public.chat_messages FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = chat_messages.lead_id
    AND l.organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
  )
);

CREATE POLICY "Usuários podem inserir mensagens" 
ON public.chat_messages FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = chat_messages.lead_id
    AND l.organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
  )
);

-- 5. Atualizar função ou trigger de updated_at para leads se necessário
-- (Geralmente leads já tem um trigger de update, então apenas a coluna basta).
