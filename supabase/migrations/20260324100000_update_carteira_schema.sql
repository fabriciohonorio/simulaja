
-- Add columns for accession date and fixed bid protocol to carteira table
ALTER TABLE public.carteira 
  ADD COLUMN IF NOT EXISTS data_adesao DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS protocolo_lance_fixo_url TEXT;

-- Update existing records to use their creation date as accession date
UPDATE public.carteira 
SET data_adesao = created_at::date 
WHERE data_adesao IS NULL;
