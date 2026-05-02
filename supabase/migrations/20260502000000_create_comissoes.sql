CREATE TABLE IF NOT EXISTS comissoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    carteira_id UUID REFERENCES carteira(id) ON DELETE SET NULL,
    organizacao_id UUID REFERENCES organizacoes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES perfis(id) ON DELETE SET NULL,
    cliente_nome TEXT NOT NULL,
    valor_venda NUMERIC NOT NULL DEFAULT 0,
    regra_comissao TEXT NOT NULL, 
    taxa_comissao NUMERIC NOT NULL,
    tipo_comissionamento TEXT NOT NULL, 
    comissao_total NUMERIC NOT NULL DEFAULT 0,
    parcelas_comissao INTEGER NOT NULL DEFAULT 1,
    pagamentos_retroativos NUMERIC NOT NULL DEFAULT 0,
    meses_inadimplentes INTEGER NOT NULL DEFAULT 0,
    valor_estorno NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ativo',
    data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver comissões da sua organização"
    ON comissoes FOR SELECT
    USING (organizacao_id = (SELECT organizacao_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Usuários podem inserir comissões na sua organização"
    ON comissoes FOR INSERT
    WITH CHECK (organizacao_id = (SELECT organizacao_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Usuários podem atualizar comissões da sua organização"
    ON comissoes FOR UPDATE
    USING (organizacao_id = (SELECT organizacao_id FROM perfis WHERE id = auth.uid()));

CREATE POLICY "Usuários podem deletar comissões da sua organização"
    ON comissoes FOR DELETE
    USING (organizacao_id = (SELECT organizacao_id FROM perfis WHERE id = auth.uid()));
