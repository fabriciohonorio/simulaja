
-- Tabela para rastrear missões manuais diárias
create table if not exists public.missoes_concluidas (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    missao_id text not null,
    subref_id text, -- Ex: 'veiculos', 'imoveis'
    data date default current_date,
    organizacao_id uuid references public.organizacoes(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, missao_id, subref_id, data)
);

-- RLS
alter table public.missoes_concluidas enable row level security;

create policy "Users can view own mission progress"
    on public.missoes_concluidas for select
    using (auth.uid() = user_id);

create policy "Users can insert own mission progress"
    on public.missoes_concluidas for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own mission progress"
    on public.missoes_concluidas for delete
    using (auth.uid() = user_id);
