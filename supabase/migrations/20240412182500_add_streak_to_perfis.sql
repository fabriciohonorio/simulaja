-- Adiciona suporte a streak de atividade diária na tabela de perfis
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS streak_atual integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_record integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_dia_tratativa date;
