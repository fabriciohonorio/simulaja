
CREATE TABLE public.inadimplentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  celular text,
  tipo_consorcio text,
  valor_parcela numeric DEFAULT 0,
  parcelas_pagas integer DEFAULT 0,
  parcelas_atrasadas integer DEFAULT 0,
  grupo text,
  cota text,
  status text NOT NULL DEFAULT 'em_atraso',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.inadimplentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inadimplentes" ON public.inadimplentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert inadimplentes" ON public.inadimplentes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update inadimplentes" ON public.inadimplentes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete inadimplentes" ON public.inadimplentes FOR DELETE TO authenticated USING (true);
