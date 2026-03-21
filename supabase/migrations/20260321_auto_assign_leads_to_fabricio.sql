-- 1. Identificar o ID do Fabrício Honório (Admin/Manager principal)
-- O ID dele é '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4' (visto em migrations anteriores)

-- 2. Atualizar todos os leads atuais que estão sem responsável
UPDATE public.leads 
SET responsavel_id = '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4'
WHERE responsavel_id IS NULL;

-- 3. Criar uma trigger para garantir que novos leads sempre tenham o Fabrício como responsável se vierem vazios
CREATE OR REPLACE FUNCTION public.ensure_lead_assignment()
RETURNS trigger AS $$
BEGIN
  IF NEW.responsavel_id IS NULL THEN
    NEW.responsavel_id := '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ensure_lead_assignment ON public.leads;
CREATE TRIGGER tr_ensure_lead_assignment
BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.ensure_lead_assignment();
