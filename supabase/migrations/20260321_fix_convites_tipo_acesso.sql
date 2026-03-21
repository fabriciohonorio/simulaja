-- =====================================================
-- FIX: Adicionar coluna tipo_acesso + RLS policies para convites
-- Erro 1: "Could not find the 'tipo_acesso' column of 'convites' in the schema cache"
-- Erro 2: "new row violates row level security policy for table 'convites'"
-- =====================================================

-- 1. Adicionar coluna tipo_acesso se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'convites' AND column_name = 'tipo_acesso'
  ) THEN
    ALTER TABLE public.convites
      ADD COLUMN tipo_acesso text NOT NULL DEFAULT 'vendedor';
  END IF;
END $$;

-- Garantir constraint de valores válidos
ALTER TABLE public.convites
  DROP CONSTRAINT IF EXISTS convites_tipo_acesso_check;
ALTER TABLE public.convites
  ADD CONSTRAINT convites_tipo_acesso_check
  CHECK (tipo_acesso IN ('admin', 'manager', 'vendedor'));

-- 2. Permitir que admins/managers da org criem convites (INSERT estava ausente)
DROP POLICY IF EXISTS "Convites - Insert por admin" ON public.convites;
CREATE POLICY "Convites - Insert por admin" ON public.convites
FOR INSERT TO authenticated
WITH CHECK (
  organizacao_id = (
    SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM public.perfis
    WHERE id = auth.uid()
    AND tipo_acesso IN ('admin', 'manager')
  )
);

-- 3. Permitir que admins/managers da org deletem convites (DELETE estava ausente)
DROP POLICY IF EXISTS "Convites - Delete por admin" ON public.convites;
CREATE POLICY "Convites - Delete por admin" ON public.convites
FOR DELETE TO authenticated
USING (
  organizacao_id = (
    SELECT organizacao_id FROM public.perfis WHERE id = auth.uid() LIMIT 1
  )
  AND EXISTS (
    SELECT 1 FROM public.perfis
    WHERE id = auth.uid()
    AND tipo_acesso IN ('admin', 'manager')
  )
);
