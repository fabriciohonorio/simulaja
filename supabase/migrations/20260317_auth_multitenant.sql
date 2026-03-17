-- Migration: Multi-tenant Organization and Permission System
-- Description: Creates tables for organizations, profiles, modules, and permissions.

-- 1. Create Organizations table
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

-- 2. Create Profiles table (linked to auth.users)
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

-- 3. Create Modules table
CREATE TABLE IF NOT EXISTS public.modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- 4. Create Permissions table
CREATE TABLE IF NOT EXISTS public.permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  descricao TEXT,
  UNIQUE (modulo_id, acao)
);

-- 5. Create User Permissions table
CREATE TABLE IF NOT EXISTS public.usuario_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  permissao_id UUID NOT NULL REFERENCES public.permissoes(id) ON DELETE CASCADE,
  concedida BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (perfil_id, permissao_id)
);

-- 6. Functions and Triggers for updated_at
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

-- 7. RLS - Row Level Security (Basic Multi-tenancy)
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_permissoes ENABLE ROW LEVEL SECURITY;

-- Policies for organizacoes
CREATE POLICY "Users can view their own organization" ON public.organizacoes
  FOR SELECT USING (id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid()));

-- Policies for perfis
CREATE POLICY "Users can view profiles in their own organization" ON public.perfis
  FOR SELECT USING (organizacao_id IN (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.perfis
  FOR UPDATE USING (id = auth.uid());

-- 8. Default Modules (Examples)
INSERT INTO public.modulos (nome, slug, icone, ordem) VALUES
('Dashboard', 'dashboard', 'LayoutDashboard', 1),
('Leads', 'leads', 'Users', 2),
('Funil de Vendas', 'funil', 'GitBranch', 3),
('Configurações', 'configuracoes', 'Settings', 10)
ON CONFLICT (slug) DO NOTHING;
