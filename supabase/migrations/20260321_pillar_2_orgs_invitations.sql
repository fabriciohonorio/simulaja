/* 
  MIGRATION: Organizations and Invitations (Pillar 2)
  - Create/Redefine public.organizacoes
  - Create public.convites
  - Link existing data
*/

BEGIN;

-- 1. Criar ou Redefinir a tabela de Organizacoes
CREATE TABLE IF NOT EXISTS public.organizacoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    slug text UNIQUE,
    logo_url text,
    configuracoes jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Garantir que updated_at existe (o gatilho handle_updated_at exige!)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizacoes' AND column_name = 'updated_at') THEN
        ALTER TABLE public.organizacoes ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Habilitar RLS nela
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;

-- 2. Migrar a organização padrão existente
INSERT INTO public.organizacoes (id, nome, slug)
VALUES ('8b1a2dcc-83cd-4985-a828-f3870dcbc2a4', 'Simulajá Padrão', 'padrao')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;

-- 3. Atualizar Perfis para referenciar a tabela real
-- (Se já houver lixo na organizacao_id, limpamos)
UPDATE public.perfis SET organizacao_id = '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4' WHERE organizacao_id IS NULL;

-- 4. Criar a tabela de Convites
CREATE TABLE IF NOT EXISTS public.convites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    token text UNIQUE NOT NULL,
    organizacao_id uuid REFERENCES public.organizacoes(id) ON DELETE CASCADE,
    convidado_por uuid REFERENCES auth.users(id),
    status text DEFAULT 'pendente', -- pendente, aceito, expirado
    expires_at timestamptz DEFAULT (now() + interval '7 days'),
    created_at timestamptz DEFAULT now()
);

-- Garantir que updated_at existe (o gatilho handle_updated_at exige!)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'convites' AND column_name = 'updated_at') THEN
        ALTER TABLE public.convites ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para Organizacoes e Convites
-- (Donos podem ver sua própria org)
DROP POLICY IF EXISTS "org_select" ON public.organizacoes;
CREATE POLICY "org_select" ON public.organizacoes FOR SELECT TO authenticated 
USING (id = public.get_my_org_id());

-- (Donos podem ver seus convites enviados)
DROP POLICY IF EXISTS "convites_select" ON public.convites;
CREATE POLICY "convites_select" ON public.convites FOR SELECT TO authenticated 
USING (organizacao_id = public.get_my_org_id());

COMMIT;
