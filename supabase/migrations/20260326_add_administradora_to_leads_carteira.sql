-- Add administradora column to leads if it doesn't exist
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS administradora TEXT;

-- Add administradora column to carteira if it doesn't exist
ALTER TABLE public.carteira 
  ADD COLUMN IF NOT EXISTS administradora TEXT;
