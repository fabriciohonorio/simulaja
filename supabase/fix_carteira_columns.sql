-- 1. Adiciona as colunas ausentes na tabela 'carteira'
ALTER TABLE public.carteira 
  ADD COLUMN IF NOT EXISTS celular TEXT,
  ADD COLUMN IF NOT EXISTS tipo_consorcio TEXT;

-- 2. Insere na tabela de leads (Funil de Vendas como Retroativo Vendido)
DO $$ 
DECLARE
  v_org_id UUID;
  v_lead_id UUID;
BEGIN
  -- Pega o organizacao_id do painel administrativo
  SELECT organizacao_id INTO v_org_id FROM perfis WHERE organizacao_id IS NOT NULL LIMIT 1;

  INSERT INTO leads (
    nome, celular, tipo_consorcio, valor_credito, status, grupo, cota, administradora, status_updated_at, created_at, organizacao_id
  ) VALUES (
    'WAGNER TAVARES DA SILVA', '41997407173', 'imovel', 320000, 'venda_fechada', '1556', '0228', 'SERVOPA', '2024-04-29T12:00:00Z', '2024-04-29T12:00:00Z', v_org_id
  )
  ON CONFLICT DO NOTHING RETURNING id INTO v_lead_id;

  IF v_lead_id IS NULL THEN
    SELECT id INTO v_lead_id FROM leads WHERE nome ILIKE '%WAGNER TAVARES DA SILVA%' LIMIT 1;
  END IF;

  -- 3. Insere diretamente na Carteira de Clientes
  IF v_lead_id IS NOT NULL THEN
    INSERT INTO carteira (
      lead_id, nome, celular, tipo_consorcio, valor_credito, grupo, cota, administradora, status, data_adesao, organizacao_id
    ) VALUES (
      v_lead_id, 'WAGNER TAVARES DA SILVA', '41997407173', 'imovel', 320000, '1556', '0228', 'SERVOPA', 'ativo', '2024-04-29', v_org_id
    )
    ON CONFLICT (lead_id) DO UPDATE SET 
      grupo = '1556', cota = '0228', administradora = 'SERVOPA';
  END IF;
END $$;
