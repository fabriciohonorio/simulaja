-- SQL to Promote a User to Admin (Total Access)
-- INSTRUCTIONS: Replace 'seu-email@exemplo.com' with your actual account email.

-- 1. Create a Default Organization if none exists
INSERT INTO public.organizacoes (nome, slug, plano, max_usuarios, max_leads)
VALUES ('Administração Principal', 'admin-principal', 'enterprise', 99, 999999)
ON CONFLICT (slug) DO NOTHING;

-- 2. Link your Auth user to the Profile table
-- This depends on finding your ID from Supabase's auth.users table
DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_email TEXT := 'fabriciohonorio@hotmail.com'; -- <--- REPLACE THIS EMAIL
BEGIN
    -- Get your user ID from auth.users (Supabase managed table)
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    -- Get the ID of the organization we just created
    SELECT id INTO v_org_id FROM public.organizacoes WHERE slug = 'admin-principal';
    
    IF v_user_id IS NOT NULL THEN
        -- Insert or Update your profile to have Total Access
        INSERT INTO public.perfis (id, organizacao_id, nome_completo, tipo_acesso, ativo)
        VALUES (v_user_id, v_org_id, 'Administrador do Sistema', 'total', true)
        ON CONFLICT (id) DO UPDATE 
        SET tipo_acesso = 'total', 
            organizacao_id = EXCLUDED.organizacao_id,
            ativo = true;
            
        RAISE NOTICE 'Usuário % promovido a Administrador com Sucesso!', v_email;
    ELSE
        RAISE EXCEPTION 'Usuário com o email % não encontrado na tabela auth.users. Por favor, verifique o email e tente novamente.', v_email;
    END IF;
END $$;
