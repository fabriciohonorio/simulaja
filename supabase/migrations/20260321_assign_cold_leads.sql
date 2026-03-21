-- Create a function to automatically assign cold leads
CREATE OR REPLACE FUNCTION auto_assign_cold_leads()
RETURNS TRIGGER AS $$
DECLARE
    fabricio_id UUID;
BEGIN
    -- Check if the lead is "frio" and has no assigned responsible yet
    IF NEW.lead_temperatura = 'frio' AND NEW.responsavel_id IS NULL THEN
        -- Find the Fabricio Honorio user ID in the perfis table
        SELECT id INTO fabricio_id FROM public.perfis WHERE nome_completo ILIKE '%Fabricio Honório%' LIMIT 1;
        
        IF fabricio_id IS NOT NULL THEN
            NEW.responsavel_id := fabricio_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_cold_leads ON public.leads;
CREATE TRIGGER trigger_auto_assign_cold_leads
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION auto_assign_cold_leads();
