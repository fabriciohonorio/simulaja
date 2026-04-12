-- Adiciona campo para armazenar o ID do evento no Google Calendar
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gcal_event_id text;
