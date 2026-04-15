
-- Adicionar política de UPDATE para missoes_concluidas
create policy "Users can update own mission progress"
    on public.missoes_concluidas for update
    using (auth.uid() = user_id);
