/* 
  MIGRATION: Hardening Multi-tenancy (Pillar 1) - REVISION 2
  - PURGE all old policies
  - Re-apply strict isolation
*/

DO $$ 
DECLARE 
    tbl text;
    pol text;
BEGIN 
    -- 1. Purge literalment tuda as políticas das tabelas core
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('leads', 'historico_contatos', 'carteira', 'inadimplentes', 'meta', 'termometro_mercado', 'dicas_estrategicas', 'interacoes', 'propostas', 'Prompts')
    LOOP
        FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
        END LOOP;
    END LOOP;

    -- 2. Garantir que o RLS está ligado em todas
    EXECUTE 'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.carteira ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.inadimplentes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.meta ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.termometro_mercado ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.dicas_estrategicas ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public."Prompts" ENABLE ROW LEVEL SECURITY';
END $$;

-- 3. Aplicação das Novas Políticas Estritas (Fora do bloco para evitar erros de criação)

-- LEADS
CREATE POLICY "leads_isolation" ON public.leads FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- Allow public insert (simulator)
CREATE POLICY "leads_public_insert" ON public.leads FOR INSERT TO anon 
WITH CHECK (true);

-- HISTORICO
CREATE POLICY "historico_isolation" ON public.historico_contatos FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- CARTEIRA
CREATE POLICY "carteira_isolation" ON public.carteira FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- INADIMPLENTES
CREATE POLICY "inadimplentes_isolation" ON public.inadimplentes FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- META
CREATE POLICY "meta_isolation" ON public.meta FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- TERMOMETRO
CREATE POLICY "termometro_isolation" ON public.termometro_mercado FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- DICAS
CREATE POLICY "dicas_isolation" ON public.dicas_estrategicas FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- INTERACOES
CREATE POLICY "interacoes_isolation" ON public.interacoes FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- PROPOSTAS
CREATE POLICY "propostas_isolation" ON public.propostas FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- PROMPTS
CREATE POLICY "prompts_isolation" ON public."Prompts" FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());
