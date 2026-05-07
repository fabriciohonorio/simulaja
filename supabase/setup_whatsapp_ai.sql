
-- 1. Adicionar controle de IA na tabela de leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS atendimento_ia BOOLEAN DEFAULT TRUE;

-- 2. Criar a tabela de histórico de chat do WhatsApp
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('client', 'ai', 'agent')),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT now(),
    organizacao_id UUID REFERENCES organizacoes(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Habilitar Realtime para as novas mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 4. Políticas de Segurança (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver mensagens da sua organização"
ON chat_messages FOR SELECT
USING (auth.uid() IN (
    SELECT id FROM perfis WHERE organizacao_id = chat_messages.organizacao_id
));

CREATE POLICY "Usuários podem inserir mensagens"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid() IN (
    SELECT id FROM perfis WHERE organizacao_id = chat_messages.organizacao_id
));
