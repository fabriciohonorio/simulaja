-- 1. Definição da Função de Ajuda (deve estar fora do bloco DO)
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Bloco de Execução Principal
DO $$ 
DECLARE 
    default_org_id uuid := '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4';
BEGIN 

-- Saneamento de Dados (Leads órfãos)
UPDATE public.leads SET organizacao_id = default_org_id WHERE organizacao_id IS NULL;

-- Adicionar Colunas Faltantes em Tabelas que precisam de isolamento
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interacoes' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.interacoes ADD COLUMN organizacao_id uuid DEFAULT '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4';
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.propostas ADD COLUMN organizacao_id uuid DEFAULT '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4';
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'termometro_mercado' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.termometro_mercado ADD COLUMN organizacao_id uuid DEFAULT '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4';
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dicas_estrategicas' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.dicas_estrategicas ADD COLUMN organizacao_id uuid DEFAULT '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4';
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Prompts' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public."Prompts" ADD COLUMN organizacao_id uuid DEFAULT '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4';
END IF;

-- Endurecimento do RLS (ENABLE RLS em todas as tabelas)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carteira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termometro_mercado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dicas_estrategicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Prompts" ENABLE ROW LEVEL SECURITY;

END $$;

-- 3. Aplicação de Políticas Estritas (Fora do bloco DO para clareza)

-- LEADS
DROP POLICY IF EXISTS "leads_isolation" ON public.leads;
CREATE POLICY "leads_isolation" ON public.leads FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- HISTORICO
DROP POLICY IF EXISTS "historico_isolation" ON public.historico_contatos;
CREATE POLICY "historico_isolation" ON public.historico_contatos FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- CARTEIRA
DROP POLICY IF EXISTS "carteira_isolation" ON public.carteira;
CREATE POLICY "carteira_isolation" ON public.carteira FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- INADIMPLENTES
DROP POLICY IF EXISTS "inadimplentes_isolation" ON public.inadimplentes;
CREATE POLICY "inadimplentes_isolation" ON public.inadimplentes FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- META
DROP POLICY IF EXISTS "meta_isolation" ON public.meta;
CREATE POLICY "meta_isolation" ON public.meta FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- TERMOMETRO
DROP POLICY IF EXISTS "termometro_isolation" ON public.termometro_mercado;
CREATE POLICY "termometro_isolation" ON public.termometro_mercado FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- DICAS
DROP POLICY IF EXISTS "dicas_isolation" ON public.dicas_estrategicas;
CREATE POLICY "dicas_isolation" ON public.dicas_estrategicas FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- INTERACOES
DROP POLICY IF EXISTS "interacoes_isolation" ON public.interacoes;
CREATE POLICY "interacoes_isolation" ON public.interacoes FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- PROPOSTAS
DROP POLICY IF EXISTS "propostas_isolation" ON public.propostas;
CREATE POLICY "propostas_isolation" ON public.propostas FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- PROMPTS
DROP POLICY IF EXISTS "prompts_isolation" ON public."Prompts";
CREATE POLICY "prompts_isolation" ON public."Prompts" FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());
