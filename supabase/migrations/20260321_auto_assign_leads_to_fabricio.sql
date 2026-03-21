-- 1. Buscar dinamicamente o ID do Admin da organização principal
DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Busca o primeiro admin que encontrar no sistema
    SELECT id INTO admin_id 
    FROM public.perfis 
    WHERE tipo_acesso = 'admin' 
    LIMIT 1;

    -- Se não achar admin, tenta o manager
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM public.perfis WHERE tipo_acesso = 'manager' LIMIT 1;
    END IF;

    -- Se achou alguém, executa a limpeza
    IF admin_id IS NOT NULL THEN
        -- Atualizar leads órfãos
        UPDATE public.leads SET responsavel_id = admin_id WHERE responsavel_id IS NULL;

        -- Criar/Atualizar a função de atribuição automática
        EXECUTE format('
            CREATE OR REPLACE FUNCTION public.ensure_lead_assignment()
            RETURNS trigger AS $func$
            BEGIN
                IF NEW.responsavel_id IS NULL THEN
                    NEW.responsavel_id := %L;
                END IF;
                RETURN NEW;
            END;
            $func$ LANGUAGE plpgsql;', admin_id);

        -- Criar a trigger
        DROP TRIGGER IF EXISTS tr_ensure_lead_assignment ON public.leads;
        CREATE TRIGGER tr_ensure_lead_assignment
        BEFORE INSERT ON public.leads
        FOR EACH ROW EXECUTE FUNCTION public.ensure_lead_assignment();
        
        RAISE NOTICE 'Sucesso! Leads vinculados ao Admin ID: %', admin_id;
    ELSE
        RAISE EXCEPTION 'Não foi possível encontrar um Administrador no sistema para atribuir os leads.';
    END IF;
END $$;
