/* 
  MIGRATION: Full Lockdown (Pillar 1)
  - Force RLS on all tables
  - Ensure zero leak for anon
*/

BEGIN;

-- 1. Forçar RLS em todas as tabelas (importante para SaaS)
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.historico_contatos FORCE ROW LEVEL SECURITY;
ALTER TABLE public.carteira FORCE ROW LEVEL SECURITY;
ALTER TABLE public.inadimplentes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.meta FORCE ROW LEVEL SECURITY;
ALTER TABLE public.termometro_mercado FORCE ROW LEVEL SECURITY;
ALTER TABLE public.dicas_estrategicas FORCE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.propostas FORCE ROW LEVEL SECURITY;
ALTER TABLE public."Prompts" FORCE ROW LEVEL SECURITY;

-- 2. Garantir que anon não tem SELECT em NADA
-- Se existir alguma política antiga de SELECT para anon/public, vamos remover agora
-- Já fizemos no purge, mas vamos reforçar para Leads especificamente
DROP POLICY IF EXISTS "Public can select leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public select" ON public.leads;

-- 3. Confirmar a política de exclusividade do authenticated
DROP POLICY IF EXISTS "leads_isolation" ON public.leads;
CREATE POLICY "leads_isolation" ON public.leads FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

COMMIT;
