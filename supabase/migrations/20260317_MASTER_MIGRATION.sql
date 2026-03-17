-- ==========================================================
-- MASTER CRM MULTI-TENANT MIGRATION
-- ==========================================================
-- This script performs a complete migration:
-- 1. Creates the organization and permission structure.
-- 2. Sets up a default organization ('admin-principal').
-- 3. Adds 'organizacao_id' to ALL CRM and Market tables.
-- 4. Automatically assigns all existing data to the default org.
-- 5. Enables Row Level Security (RLS) and sets up isolation policies.
-- ==========================================================

-- 1. SCHEMA SETUP (Organizations & Permissions)
CREATE TABLE IF NOT EXISTS public.organizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  plano TEXT NOT NULL CHECK (plano IN ('free', 'starter', 'pro', 'enterprise')),
  max_usuarios INTEGER NOT NULL DEFAULT 1,
  max_leads INTEGER NOT NULL DEFAULT 100,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL,
  nome_completo TEXT,
  avatar_url TEXT,
  cargo TEXT,
  telefone TEXT,
  tipo_acesso TEXT NOT NULL CHECK (tipo_acesso IN ('total', 'parcial')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  descricao TEXT,
  UNIQUE (modulo_id, acao)
);

CREATE TABLE IF NOT EXISTS public.usuario_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  permissao_id UUID NOT NULL REFERENCES public.permissoes(id) ON DELETE CASCADE,
  concedida BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (perfil_id, permissao_id)
);

-- 6. FUNCTIONS AND TRIGGERS FOR updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_organizacoes_updated_at
  BEFORE UPDATE ON public.organizacoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_perfis_updated_at
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. SETUP DEFAULT ORGANIZATION
INSERT INTO public.organizacoes (nome, slug, plano, max_usuarios, max_leads)
VALUES ('Administração Principal', 'admin-principal', 'enterprise', 99, 999999)
ON CONFLICT (slug) DO NOTHING;

-- 3. UPDATE CRM TABLES (Add organizacao_id)
DO $$
BEGIN
  -- List of tables to add organizacao_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.leads ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carteira' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.carteira ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inadimplentes' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.inadimplentes ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meta' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.meta ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propostas' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.propostas ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interacoes' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.interacoes ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historico_contatos' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.historico_contatos ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;

  -- Market Tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'termometro_mercado' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.termometro_mercado ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metricas_segmentos' AND column_name = 'organizacao_id') THEN
    ALTER TABLE public.metricas_segmentos ADD COLUMN organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL;
  END IF;
  
  -- dicas_estrategicas is child of termometro_mercado, might not need direct ID but let's add for safety if needed
  -- For now we'll keep it as-is (linked via termometro_id).
END $$;

-- 4. ASSIGN ALL DATA TO DEFAULT ORGANIZATION
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
        UPDATE public.termometro_mercado SET organizacao_id = v_org_id WHERE organizacao_id IS NULL;
        UPDATE public.metricas_segmentos SET organizacao_id = v_org_id WHERE organizacao_id IS NULL;
    END IF;
END $$;

-- 5. ENABLE RLS & POLICIES
-- Enabling RLS
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carteira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termometro_mercado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_segmentos ENABLE ROW LEVEL SECURITY;

-- Creating Common Isolation Policy (Select, Insert, Update, Delete)
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY['leads', 'carteira', 'inadimplentes', 'meta', 'propostas', 'interacoes', 'historico_contatos', 'termometro_mercado', 'metricas_segmentos'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Isolation Policy %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Isolation Policy %I" ON public.%I FOR ALL USING (organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid()))', t, t);
    END LOOP;
END $$;

-- Specific policies for Auth tables
DROP POLICY IF EXISTS "Users view their own organization" ON public.organizacoes;
CREATE POLICY "Users view their own organization" ON public.organizacoes 
FOR SELECT USING (id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users view profiles in same org" ON public.perfis;
CREATE POLICY "Users view profiles in same org" ON public.perfis 
FOR SELECT USING (organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users update own profile" ON public.perfis;
CREATE POLICY "Users update own profile" ON public.perfis 
FOR UPDATE USING (id = auth.uid());

-- 6. DEFAULT MODULES
INSERT INTO public.modulos (nome, slug, icone, ordem) VALUES
('Dashboard', 'dashboard', 'LayoutDashboard', 1),
('Leads', 'leads', 'Users', 2),
('Funil de Vendas', 'funil', 'GitBranch', 3),
('Simulador', 'simulador', 'Calculator', 4),
('Carteira', 'carteira', 'Briefcase', 5),
('Inadimplentes', 'inadimplentes', 'AlertTriangle', 6),
('Configurações', 'configuracoes', 'Settings', 10)
ON CONFLICT (slug) DO UPDATE SET icone = EXCLUDED.icone, ordem = EXCLUDED.ordem;

-- 7. DEFAULT PERMISSIONS
DO $$
DECLARE
    m_id UUID;
    m_slug TEXT;
    actions TEXT[] := ARRAY['Visualizar', 'Criar/Editar', 'Excluir'];
    a TEXT;
BEGIN
    FOR m_id, m_slug IN SELECT id, slug FROM public.modulos LOOP
        FOREACH a IN ARRAY actions LOOP
            INSERT INTO public.permissoes (modulo_id, acao, descricao)
            VALUES (m_id, a, format('Permite %s no módulo %s', a, m_slug))
            ON CONFLICT (modulo_id, acao) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- SUCCESS MESSAGE
-- RAISE NOTICE 'Migration Master complete. Existing leads assigned to "admin-principal".';
