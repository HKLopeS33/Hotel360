-- Valores de diária por tipo de quarto, configurados pelo hotel: { "single": 150, "double": 200, ... }
-- Quando um tipo não tem valor definido, usa-se online_valor_diaria como padrão.
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_quartos_precos JSONB NOT NULL DEFAULT '{}'::jsonb;
