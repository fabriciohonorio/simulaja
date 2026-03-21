-- Atualizar a função handle_new_user para capturar organizacao_id e tipo_acesso dos metadados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, nome_completo, organizacao_id, tipo_acesso)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nome_completo', new.email),
    COALESCE(
      (new.raw_user_meta_data->>'organizacao_id')::uuid, 
      '8b1a2dcc-83cd-4985-a828-f3870dcbc2a4' -- Org padrão caso falhe
    ),
    COALESCE(new.raw_user_meta_data->>'tipo_acesso', 'vendedor')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
