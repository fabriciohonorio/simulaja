-- Função para criar perfil automaticamente ao cadastrar novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, nome_completo, organizacao_id, tipo_acesso)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nome_completo', new.email),
    '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4', -- Default org (Simulajá Padrão)
    'vendedor'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para disparar a função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Garantir que perfis permite UPDATE pelo próprio usuário
DROP POLICY IF EXISTS "Perfil - Update próprio" ON public.perfis;
CREATE POLICY "Perfil - Update próprio" ON public.perfis
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Garantir que perfis permite SELECT pelo próprio usuário (reforçando)
DROP POLICY IF EXISTS "Perfil - Select próprio" ON public.perfis;
CREATE POLICY "Perfil - Select próprio" ON public.perfis
FOR SELECT TO authenticated
USING (id = auth.uid());
