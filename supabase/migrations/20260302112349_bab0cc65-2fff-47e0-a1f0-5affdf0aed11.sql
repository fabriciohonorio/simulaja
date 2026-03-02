
-- Create carteira table
CREATE TABLE public.carteira (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  tipo_consorcio TEXT,
  valor_credito NUMERIC,
  grupo TEXT,
  cota TEXT,
  status TEXT NOT NULL DEFAULT 'aguardando',
  cota_contemplada TEXT,
  data_contemplacao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.carteira ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read carteira" ON public.carteira FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert carteira" ON public.carteira FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update carteira" ON public.carteira FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Add segment meta columns to meta table
ALTER TABLE public.meta
  ADD COLUMN IF NOT EXISTS meta_imoveis NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_veiculos NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_motos NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_outros NUMERIC DEFAULT 0;
