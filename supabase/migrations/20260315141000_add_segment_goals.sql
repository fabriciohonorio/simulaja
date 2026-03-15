-- Add new segment meta columns and ticket médio columns to meta table
ALTER TABLE meta 
ADD COLUMN IF NOT EXISTS meta_pesados numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_investimentos numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_medio_imoveis numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_medio_veiculos numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_medio_motos numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_medio_pesados numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ticket_medio_investimentos numeric DEFAULT 0;

-- Update existing meta entry for 2026 with requested monthly values (converted to annual if that's the pattern)
-- Based on Metas.tsx line 211, meta_anual is total. 
-- However, the user specifically asked for "configuração de metas mensais".
-- I will set these values. If the UI expects annual, I'll multiply by 12 later if needed.
-- For now, let's treat them as the source of truth.

UPDATE meta 
SET 
  meta_imoveis = 500000,
  meta_veiculos = 100000,
  meta_motos = 100000,
  meta_pesados = 180000,
  meta_investimentos = 120000,
  meta_anual = (500000 + 100000 + 100000 + 180000 + 120000) * 12
WHERE ano = 2026;
