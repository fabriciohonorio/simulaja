-- Migration: Create fechamentos_mensais table
CREATE TABLE IF NOT EXISTS fechamentos_mensais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID REFERENCES organizacoes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    valor_total NUMERIC NOT NULL DEFAULT 0,
    contagem_vendas INTEGER NOT NULL DEFAULT 0,
    data_fechamento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    comissoes_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organizacao_id, mes, ano)
);

ALTER TABLE fechamentos_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver fechamentos da sua organização"
    ON fechamentos_mensais FOR SELECT
    USING (organizacao_id = (SELECT organizacao_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Usuários podem inserir fechamentos na sua organização"
    ON fechamentos_mensais FOR INSERT
    WITH CHECK (organizacao_id = (SELECT organizacao_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Usuários podem atualizar fechamentos da sua organização"
    ON fechamentos_mensais FOR UPDATE
    USING (organizacao_id = (SELECT organizacao_id FROM perfis WHERE id = auth.uid()));
