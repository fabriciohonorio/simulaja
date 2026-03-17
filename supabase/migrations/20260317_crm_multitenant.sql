-- Migration: CRM Multi-tenancy and Organization
-- Description: Adds organizacao_id to data tables, enables RLS, and populates with sample data.

-- 1. Add organizacao_id column to data tables
DO $$
BEGIN
  -- Leads - Add missing intelligence columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'origem') THEN
    ALTER TABLE public.leads ADD COLUMN origem TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status_updated_at') THEN
    ALTER TABLE public.leads ADD COLUMN status_updated_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_interaction_at') THEN
    ALTER TABLE public.leads ADD COLUMN last_interaction_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'propensity_score') THEN
    ALTER TABLE public.leads ADD COLUMN propensity_score INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'propensity_reason') THEN
    ALTER TABLE public.leads ADD COLUMN propensity_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.leads ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;

  -- Carteira
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carteira' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.carteira ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;

  -- Inadimplentes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inadimplentes' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.inadimplentes ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;

  -- Meta
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meta' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.meta ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;

  -- Propostas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.propostas ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;

  -- Interacoes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interacoes' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.interacoes ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;
  
  -- Historico Contatos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historico_contatos' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.historico_contatos ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Assign existing data to the default organization (admin-principal)
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM public.organizacoes WHERE slug = 'admin-principal';
    
    IF v_org_id IS NOT NULL THEN
        UPDATE public.leads SET organizacao_id = v_org_id WHERE organizacao_id IS NULL;
        UPDATE public.carteira SET organizacao_id = v_org_id WHERE organizacao_id IS NULL;
        UPDATE public.inadimplentes SET organizacao_id = v_org_id WHERE organizacao_id IS NULL;
        UPDATE public.meta SET organizacao_id = v_org_id WHERE organizacao_id IS NULL;
        UPDATE public.propostas SET organizacao_id = v_org_id WHERE organizacao_id IS NULL;
        UPDATE public.interacoes SET organizacao_id = v_org_id WHERE organizacao_id IS NULL;
        UPDATE public.historico_contatos SET organizacao_id = v_org_id WHERE organizacao_id IS NULL;
    END IF;
END $$;

-- 3. Enable RLS on all CRM tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carteira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY;

-- 4. Create Isolation Policies (Common Pattern)
CREATE POLICY "Users can only see leads from their organization" 
ON public.leads FOR ALL USING (
  organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
);

CREATE POLICY "Users can only see carteira from their organization" 
ON public.carteira FOR ALL USING (
  organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
);

CREATE POLICY "Users can only see inadimplentes from their organization" 
ON public.inadimplentes FOR ALL USING (
  organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
);

CREATE POLICY "Users can only see meta from their organization" 
ON public.meta FOR ALL USING (
  organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
);

CREATE POLICY "Users can only see propostas from their organization" 
ON public.propostas FOR ALL USING (
  organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
);

CREATE POLICY "Users can only see interacoes from their organization" 
ON public.interacoes FOR ALL USING (
  organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
);

CREATE POLICY "Users can only see historico_contatos from their organization" 
ON public.historico_contatos FOR ALL USING (
  organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
);

-- 5. Insert Sample "Organized" Data for testing
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM public.organizacoes WHERE slug = 'admin-principal';
    
    IF v_org_id IS NOT NULL THEN
        -- Insert a few sample leads if the table is low on data
        IF (SELECT count(*) FROM public.leads WHERE organizacao_id = v_org_id) < 5 THEN
            INSERT INTO public.leads (nome, email, celular, cidade, tipo_consorcio, valor_credito, status, lead_temperatura, lead_score_valor, organizacao_id)
            VALUES 
            ('Carlos Oliveira', 'carlos@exemplo.com', '11999998888', 'São Paulo', 'imovel', 450000, 'novo', 'quente', 'premium', v_org_id),
            ('Ana Souza', 'ana@exemplo.com', '21988887777', 'Rio de Janeiro', 'veiculo', 85000, 'contatado', 'morno', 'alto', v_org_id),
            ('Roberto Lima', 'roberto@exemplo.com', '31977776666', 'Belo Horizonte', 'investimento', 200000, 'proposta_enviada', 'quente', 'premium', v_org_id),
            ('Mariana Costa', 'mari@exemplo.com', '41966665555', 'Curitiba', 'moto', 25000, 'em_negociacao', 'frio', 'baixo', v_org_id),
            ('Lucas Ferras', 'lucas@exemplo.com', '51955554444', 'Porto Alegre', 'pesados', 600000, 'novo', 'quente', 'premium', v_org_id);
        END IF;
    END IF;
END $$;
