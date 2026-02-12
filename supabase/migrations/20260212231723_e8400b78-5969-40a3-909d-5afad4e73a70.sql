-- Permitir INSERT público na tabela leads (formulário público sem autenticação)
CREATE POLICY "Allow public insert on leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Permitir SELECT público para leitura dos leads (necessário para .select().single() após insert)
CREATE POLICY "Allow public select on leads"
ON public.leads
FOR SELECT
USING (true);