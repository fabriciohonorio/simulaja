-- Este script pode ser rodado no SQL Editor do seu Supabase para inserir o cliente retroativo
-- WAGNER TAVARES DA SILVA e associá-lo corretamente ao seu perfil (organização)

DO $$ 
DECLARE
  v_org_id UUID;
  v_lead_id UUID;
BEGIN
  -- 1. Pega o organizacao_id do painel administrativo principal
  -- (Pega a primeira organização ativa disponível para injetar o lead caso falte)
  SELECT id INTO v_org_id FROM organizacoes LIMIT 1;
  
  -- Se não existir organizacao estruturada ainda, tenta vincular pelo profile principal:
  IF v_org_id IS NULL THEN
    SELECT organizacao_id INTO v_org_id FROM perfis WHERE organizacao_id IS NOT NULL LIMIT 1;
  END IF;

  -- 2. Insere na tabela de leads (Funil de Vendas)
  INSERT INTO leads (
    nome, 
    celular, 
    tipo_consorcio, 
    valor_credito, 
    status, 
    grupo, 
    cota, 
    administradora, 
    status_updated_at, 
    created_at, 
    organizacao_id
  ) 
  VALUES (
    'WAGNER TAVARES DA SILVA', 
    '41997407173', 
    'imovel', 
    320000, 
    'venda_fechada', 
    '1556', 
    '0228', 
    'SERVOPA', 
    '2024-04-29T12:00:00Z', 
    '2024-04-29T12:00:00Z', 
    v_org_id
  )
  ON CONFLICT DO NOTHING -- Se o lead já existir, não falha
  RETURNING id INTO v_lead_id;

  -- Se o lead já existia, busca o id dele para garantir inserção na carteira
  IF v_lead_id IS NULL THEN
    SELECT id INTO v_lead_id FROM leads WHERE nome ILIKE '%WAGNER TAVARES DA SILVA%' LIMIT 1;
  END IF;

  -- 3. Insere na Carteira de Clientes
  IF v_lead_id IS NOT NULL THEN
    INSERT INTO carteira (
      lead_id,
      nome,
      celular,
      tipo_consorcio,
      valor_credito,
      grupo,
      cota,
      administradora,
      status,
      data_adesao,
      organizacao_id
    ) VALUES (
      v_lead_id,
      'WAGNER TAVARES DA SILVA',
      '41997407173',
      'imovel',
      320000,
      '1556',
      '0228',
      'SERVOPA',
      'ativo',
      '2024-04-29',
      v_org_id
    )
    ON CONFLICT (lead_id) DO UPDATE SET 
      grupo = '1556',
      cota = '0228',
      administradora = 'SERVOPA';
  END IF;
  
END $$;
