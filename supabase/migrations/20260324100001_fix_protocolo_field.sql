
-- Rename the protocol column and ensure it is treated as text for the number
ALTER TABLE public.carteira 
  RENAME COLUMN protocolo_lance_fixo_url TO protocolo_lance_fixo;

-- Ensure the column description is clear
COMMENT ON COLUMN public.carteira.protocolo_lance_fixo IS 'Número do protocolo para o lance fixo';
