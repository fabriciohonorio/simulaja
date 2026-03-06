-- Propensity Ranking Fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS propensity_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS propensity_reason TEXT;

-- Initial comments for documentation
COMMENT ON COLUMN leads.propensity_score IS 'Chance de fechamento calculada (0-100)';
COMMENT ON COLUMN leads.propensity_reason IS 'Motivo da pontuação de propensão';
