-- Intelligence Lead System Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score_valor TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_temperatura TEXT DEFAULT 'Quente';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'Simulador';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Logic for lead_score_valor automation should be done in frontend or a trigger. 
-- For now, let's just ensure the columns exist.

-- Comments for documentation
COMMENT ON COLUMN leads.lead_score_valor IS '💎 Premium (>500k), 🔥 Alto (>200k), 🚀 Médio (>80k), 🌱 Baixo (<80k)';
COMMENT ON COLUMN leads.lead_temperatura IS '🔥 Quente, 🌤 Morno, ❄️ Frio, ☠️ Lead Morto';
COMMENT ON COLUMN leads.origem IS 'simulador, whatsapp, google, etc';
