-- VERIFICAR SE TABELA termometro_mercado JÁ EXISTE
-- Se não existir, criar:
CREATE TABLE IF NOT EXISTS termometro_mercado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia DATE NOT NULL UNIQUE,
  participantes_ativos DECIMAL(15,2),
  participantes_ativos_variacao DECIMAL(5,2),
  vendas_cotas INTEGER,
  vendas_cotas_variacao DECIMAL(5,2),
  creditos_comercializados DECIMAL(15,2),
  creditos_comercializados_variacao DECIMAL(5,2),
  ticket_medio DECIMAL(15,2),
  ticket_medio_variacao DECIMAL(5,2),
  contemplacoes INTEGER,
  contemplacoes_variacao DECIMAL(5,2),
  creditos_disponibilizados DECIMAL(15,2),
  creditos_disponibilizados_variacao DECIMAL(5,2),
  temperatura VARCHAR(20),
  temperatura_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABELA: DICAS ESTRATÉGICAS (NOVA)
CREATE TABLE IF NOT EXISTS dicas_estrategicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  termometro_id UUID REFERENCES termometro_mercado(id) ON DELETE CASCADE,
  categoria VARCHAR(50),
  prioridade INTEGER DEFAULT 1,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NOT NULL,
  emoji VARCHAR(10),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABELA: MÉTRICAS POR SEGMENTO (NOVA)
CREATE TABLE IF NOT EXISTS metricas_segmentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia DATE NOT NULL,
  segmento VARCHAR(50) NOT NULL CHECK (segmento IN ('imoveis', 'veiculos', 'motos', 'investimentos', 'pesados')),
  total_leads INTEGER DEFAULT 0,
  total_vendas INTEGER DEFAULT 0,
  valor_total DECIMAL(15,2) DEFAULT 0,
  ticket_medio DECIMAL(15,2) DEFAULT 0,
  taxa_conversao DECIMAL(5,2) DEFAULT 0,
  meta_vendas INTEGER DEFAULT 0,
  progresso_meta DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mes_referencia, segmento)
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_termometro_mes ON termometro_mercado(mes_referencia DESC);
CREATE INDEX IF NOT EXISTS idx_dicas_ativo ON dicas_estrategicas(ativo, prioridade);
CREATE INDEX IF NOT EXISTS idx_metricas_mes_segmento ON metricas_segmentos(mes_referencia, segmento);

-- RLS
ALTER TABLE termometro_mercado ENABLE ROW LEVEL SECURITY;
ALTER TABLE dicas_estrategicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_segmentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura termometro" ON termometro_mercado;
CREATE POLICY "Permitir leitura termometro" ON termometro_mercado FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir update termometro" ON termometro_mercado;
CREATE POLICY "Permitir update termometro" ON termometro_mercado FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir insert termometro" ON termometro_mercado;
CREATE POLICY "Permitir insert termometro" ON termometro_mercado FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura dicas" ON dicas_estrategicas;
CREATE POLICY "Permitir leitura dicas" ON dicas_estrategicas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir leitura metricas" ON metricas_segmentos;
CREATE POLICY "Permitir leitura metricas" ON metricas_segmentos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Permitir insert metricas" ON metricas_segmentos;
CREATE POLICY "Permitir insert metricas" ON metricas_segmentos FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update metricas" ON metricas_segmentos;
CREATE POLICY "Permitir update metricas" ON metricas_segmentos FOR UPDATE TO authenticated USING (true);

-- FUNÇÃO: CALCULAR TEMPERATURA (se não existir)
CREATE OR REPLACE FUNCTION calcular_temperatura_mercado(
  p_creditos_var DECIMAL,
  p_vendas_var DECIMAL,
  p_ticket_var DECIMAL
) RETURNS JSON AS $$
DECLARE
  v_score INTEGER;
  v_temperatura VARCHAR(20);
BEGIN
  v_score := GREATEST(0, LEAST(100, 
    (p_creditos_var * 2) + (p_vendas_var * 2) + (p_ticket_var * 1) + 50
  ));
  
  IF v_score >= 70 THEN v_temperatura := 'quente';
  ELSIF v_score >= 40 THEN v_temperatura := 'morno';
  ELSE v_temperatura := 'frio';
  END IF;
  
  RETURN json_build_object('score', v_score, 'temperatura', v_temperatura);
END;
$$ LANGUAGE plpgsql;

-- DADOS REAIS ABAC - JANEIRO 2026
INSERT INTO termometro_mercado (
  mes_referencia, 
  participantes_ativos, participantes_ativos_variacao,
  vendas_cotas, vendas_cotas_variacao, 
  creditos_comercializados, creditos_comercializados_variacao, 
  ticket_medio, ticket_medio_variacao,
  contemplacoes, contemplacoes_variacao, 
  creditos_disponibilizados, creditos_disponibilizados_variacao
) VALUES (
  '2026-01-01', 
  12.78, 12.4,      -- Participantes: 12,78M (+12,4%)
  476850, 12.9,     -- Vendas cotas: 476.850 (+12,9%)
  43.15, 23.7,      -- Créditos: R$ 43,15 bi (+23,7%)
  90.49, 9.5,       -- Ticket médio: R$ 90,49k (+9,5%)
  164440, -2.8,     -- Contemplações: 164.440 (-2,8%)
  11.22, 8.0        -- Créditos disponíveis: R$ 11,22 bi (+8,0%)
) ON CONFLICT (mes_referencia) DO UPDATE SET
  participantes_ativos = EXCLUDED.participantes_ativos,
  participantes_ativos_variacao = EXCLUDED.participantes_ativos_variacao,
  vendas_cotas = EXCLUDED.vendas_cotas,
  vendas_cotas_variacao = EXCLUDED.vendas_cotas_variacao,
  creditos_comercializados = EXCLUDED.creditos_comercializados,
  creditos_comercializados_variacao = EXCLUDED.creditos_comercializados_variacao,
  ticket_medio = EXCLUDED.ticket_medio,
  ticket_medio_variacao = EXCLUDED.ticket_medio_variacao,
  contemplacoes = EXCLUDED.contemplacoes,
  contemplacoes_variacao = EXCLUDED.contemplacoes_variacao,
  creditos_disponibilizados = EXCLUDED.creditos_disponibilizados,
  creditos_disponibilizados_variacao = EXCLUDED.creditos_disponibilizados_variacao,
  updated_at = NOW();

-- Calcular temperatura automaticamente
UPDATE termometro_mercado
SET 
  temperatura = (calcular_temperatura_mercado(23.7, 12.9, 9.5)::json->>'temperatura')::VARCHAR,
  temperatura_score = (calcular_temperatura_mercado(23.7, 12.9, 9.5)::json->>'score')::INTEGER
WHERE mes_referencia = '2026-01-01';

-- DICAS ESTRATÉGICAS AUTOMÁTICAS
DO $$
DECLARE 
  v_termometro_id UUID;
BEGIN
  SELECT id INTO v_termometro_id FROM termometro_mercado WHERE mes_referencia = '2026-01-01';
  
  -- Deletar dicas antigas para recriar
  DELETE FROM dicas_estrategicas WHERE termometro_id = v_termometro_id;
  
  INSERT INTO dicas_estrategicas (termometro_id, categoria, prioridade, titulo, descricao, emoji, ativo) VALUES
  (v_termometro_id, 'foco_do_mes', 1, 
   'FOCO EM ALTO VALOR - Ticket Médio em Alta', 
   'Ticket médio subiu 9,5% para R$ 90,49 mil. Priorize leads acima de R$ 100k e grupos de IMÓVEIS. Mercado está aquecido para valores maiores!', 
   '🎯', true),
  
  (v_termometro_id, 'acao_urgente', 1, 
   'CRIAR URGÊNCIA - Demanda 23,7% Maior!', 
   'Créditos comercializados explodiram +23,7%! Use nos scripts: "Demanda cresceu muito, grupos fechando mais rápido. Garanta sua vaga AGORA!"', 
   '⚡', true),
  
  (v_termometro_id, 'argumento_vendas', 2, 
   'ARGUMENTO: Crescimento Recorde', 
   'R$ 43,15 BILHÕES comercializados em janeiro! Mostre que consórcio nunca esteve tão forte. Use prova social e números reais.', 
   '💪', true),
  
  (v_termometro_id, 'oportunidade', 2, 
   'DESTAQUE CONTEMPLAÇÃO - Mercado Desacelerou', 
   'Contemplações caíram 2,8% no mercado geral. DESTAQUE que seus grupos mantêm taxa alta! Diferencial competitivo importante.', 
   '🏆', true),
  
  (v_termometro_id, 'acao_urgente', 1, 
   'PROSPECTAR AGRESSIVO - Base +12,4%', 
   'Participantes ativos cresceram 12,4%! Mais gente está entrando em consórcios. Hora de prospectar FORTE e surfar na onda!', 
   '🌊', true);
END $$;

-- MÉTRICAS DE SEGMENTOS (DADOS EXEMPLO - AJUSTAR CONFORME SUA REALIDADE)
INSERT INTO metricas_segmentos (
  mes_referencia, segmento, 
  total_leads, total_vendas, valor_total, ticket_medio, taxa_conversao,
  meta_vendas, progresso_meta
) VALUES
('2026-01-01', 'imoveis', 45, 12, 2400000, 200000, 26.7, 15, 80.0),
('2026-01-01', 'veiculos', 120, 35, 2100000, 60000, 29.2, 40, 87.5),
('2026-01-01', 'motos', 80, 22, 660000, 30000, 27.5, 25, 88.0),
('2026-01-01', 'investimentos', 25, 8, 1600000, 200000, 32.0, 10, 80.0),
('2026-01-01', 'pesados', 15, 4, 800000, 200000, 26.7, 5, 80.0)
ON CONFLICT (mes_referencia, segmento) DO UPDATE SET
  total_leads = EXCLUDED.total_leads,
  total_vendas = EXCLUDED.total_vendas,
  valor_total = EXCLUDED.valor_total,
  ticket_medio = EXCLUDED.ticket_medio,
  taxa_conversao = EXCLUDED.taxa_conversao,
  meta_vendas = EXCLUDED.meta_vendas,
  progresso_meta = EXCLUDED.progresso_meta;
