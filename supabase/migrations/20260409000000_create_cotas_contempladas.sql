CREATE TABLE IF NOT EXISTS public.cotas_contempladas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  grupo text NOT NULL,
  cota text NOT NULL,
  segmento text,
  administradora text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotas_contempladas_org ON public.cotas_contempladas(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_cotas_contempladas_grupo ON public.cotas_contempladas(grupo);

ALTER TABLE public.cotas_contempladas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotas_contempladas_isolation" ON public.cotas_contempladas FOR ALL TO authenticated 
USING (organizacao_id = public.get_my_org_id())
WITH CHECK (organizacao_id = public.get_my_org_id());

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cotas_contempladas;
