-- SCRIPT DE RECUPERAÇÃO FINAL (VERSÃO ULTRA-SEGURA)
-- Corrige dados em massa apenas nas tabelas que possuem as colunas necessárias.

DO $$
DECLARE
    real_fabricio_id uuid := '107a58fc-e65c-459c-95e8-cdc524d72042';
    real_org_id uuid := '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4';
    bad_id uuid := '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4';
    invalid_org_id uuid := 'cd8a1506-38a5-4b81-8d3f-a3bb886c8bd8';
    tbl text;
    has_resp_col boolean;
BEGIN
    -- 1. CORREÇÃO DINÂMICA DE DADOS EM TODAS AS TABELAS CRM
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('leads', 'historico_contatos', 'interacoes', 'propostas')
    LOOP
        -- Verifica se a tabela tem responsavel_id
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'responsavel_id') INTO has_resp_col;

        IF has_resp_col THEN
            EXECUTE format('
                UPDATE public.%I 
                SET responsavel_id = %L, organizacao_id = %L 
                WHERE responsavel_id = %L OR organizacao_id = %L OR organizacao_id IS NULL', 
                tbl, real_fabricio_id, real_org_id, bad_id, invalid_org_id);
        ELSE
            EXECUTE format('
                UPDATE public.%I 
                SET organizacao_id = %L 
                WHERE organizacao_id = %L OR organizacao_id IS NULL', 
                tbl, real_org_id, invalid_org_id);
        END IF;
    END LOOP;

    RAISE NOTICE 'Recuperação de dados concluída com sucesso.';
END $$;

-- 2. POLÍTICAS DE RLS (O GESTOR VÊ TUDO, O VENDEDOR SÓ O SEU)
DO $$
DECLARE
    tbl text;
    has_responsavel boolean;
    policy_sql text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('leads', 'historico_contatos', 'carteira', 'inadimplentes', 'meta', 'termometro_mercado', 'dicas_estrategicas', 'interacoes', 'propostas', 'Prompts')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_isolation', tbl);
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl AND column_name = 'responsavel_id'
        ) INTO has_responsavel;

        IF has_responsavel THEN
            policy_sql := format('
                CREATE POLICY %I ON public.%I FOR ALL TO authenticated 
                USING (
                    CASE 
                        WHEN (SELECT tipo_acesso FROM public.perfis WHERE id = auth.uid()) IN (''admin'', ''manager'') 
                        THEN organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
                        
                        WHEN %I.responsavel_id = auth.uid() THEN true
                        
                        ELSE false
                    END
                )
                WITH CHECK (
                    organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
                );', tbl || '_isolation', tbl, tbl);
        ELSE
            policy_sql := format('
                CREATE POLICY %I ON public.%I FOR ALL TO authenticated 
                USING (
                    organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
                )
                WITH CHECK (
                    organizacao_id = (SELECT organizacao_id FROM public.perfis WHERE id = auth.uid())
                );', tbl || '_isolation', tbl);
        END IF;

        EXECUTE policy_sql;
    END LOOP;
END $$;
