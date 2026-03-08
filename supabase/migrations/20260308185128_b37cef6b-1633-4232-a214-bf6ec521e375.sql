
-- 1. FIX LEADS TABLE: Remove dangerous public SELECT/UPDATE policies
DROP POLICY IF EXISTS "Allow public select" ON public.leads;
DROP POLICY IF EXISTS "Allow public update" ON public.leads;

-- Remove duplicate public INSERT policies, keep one restricted
DROP POLICY IF EXISTS "Allow public insert" ON public.leads;
DROP POLICY IF EXISTS "Permitir inserção pública de leads" ON public.leads;

-- Create a single restricted public INSERT policy (simulator needs this)
CREATE POLICY "Public can insert leads"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure authenticated users can still read/update leads
-- (these already exist as RESTRICTIVE, recreate as PERMISSIVE)
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;

CREATE POLICY "Authenticated users can read leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. FIX META TABLE: Restrict to authenticated/admin only
DROP POLICY IF EXISTS "meta_select" ON public.meta;
DROP POLICY IF EXISTS "meta_insert" ON public.meta;
DROP POLICY IF EXISTS "meta_update" ON public.meta;

CREATE POLICY "Authenticated can read meta"
  ON public.meta FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert meta"
  ON public.meta FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update meta"
  ON public.meta FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. FIX CARTEIRA: Change RESTRICTIVE to proper authenticated policies
DROP POLICY IF EXISTS "Authenticated users can read carteira" ON public.carteira;
DROP POLICY IF EXISTS "Authenticated users can insert carteira" ON public.carteira;
DROP POLICY IF EXISTS "Authenticated users can update carteira" ON public.carteira;

CREATE POLICY "Authenticated can read carteira"
  ON public.carteira FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert carteira"
  ON public.carteira FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update carteira"
  ON public.carteira FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. FIX INADIMPLENTES: Scope to authenticated
DROP POLICY IF EXISTS "Authenticated users can read inadimplentes" ON public.inadimplentes;
DROP POLICY IF EXISTS "Authenticated users can insert inadimplentes" ON public.inadimplentes;
DROP POLICY IF EXISTS "Authenticated users can update inadimplentes" ON public.inadimplentes;
DROP POLICY IF EXISTS "Authenticated users can delete inadimplentes" ON public.inadimplentes;

CREATE POLICY "Authenticated can read inadimplentes"
  ON public.inadimplentes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert inadimplentes"
  ON public.inadimplentes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update inadimplentes"
  ON public.inadimplentes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete inadimplentes"
  ON public.inadimplentes FOR DELETE
  TO authenticated
  USING (true);

-- 5. FIX INTERACOES/PROPOSTAS: Scope to authenticated
DROP POLICY IF EXISTS "Authenticated users can read interacoes" ON public.interacoes;
DROP POLICY IF EXISTS "Authenticated users can insert interacoes" ON public.interacoes;

CREATE POLICY "Authenticated can read interacoes"
  ON public.interacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert interacoes"
  ON public.interacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read propostas" ON public.propostas;
DROP POLICY IF EXISTS "Authenticated users can insert propostas" ON public.propostas;
DROP POLICY IF EXISTS "Authenticated users can update propostas" ON public.propostas;

CREATE POLICY "Authenticated can read propostas"
  ON public.propostas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert propostas"
  ON public.propostas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update propostas"
  ON public.propostas FOR UPDATE
  TO authenticated
  USING (true);

-- 6. FIX MERCADO_TERMOMETRO: Add proper policies
CREATE POLICY "Authenticated can read termometro"
  ON public.mercado_termometro FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update termometro"
  ON public.mercado_termometro FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. FIX HISTORICO_CONTATOS: Add proper policies
CREATE POLICY "Authenticated can read historico"
  ON public.historico_contatos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert historico"
  ON public.historico_contatos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. FIX PROMPTS: Add policy
CREATE POLICY "Authenticated can read prompts"
  ON public."Prompts" FOR SELECT
  TO authenticated
  USING (true);

-- 9. FIX classificar_lead function search path
CREATE OR REPLACE FUNCTION public.classificar_lead()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  IF NEW.valor_credito >= 800000 THEN
    NEW.lead_score_valor := 'premium';
  ELSIF NEW.valor_credito >= 300000 THEN
    NEW.lead_score_valor := 'alto';
  ELSIF NEW.valor_credito >= 100000 THEN
    NEW.lead_score_valor := 'medio';
  ELSE
    NEW.lead_score_valor := 'baixo';
  END IF;
  NEW.lead_temperatura := 'quente';
  RETURN NEW;
END;
$function$;
