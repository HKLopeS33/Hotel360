-- Valor extra por veículo na reserva online (igual aos demais extras: pet, café, garagem)
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_valor_extra_veiculo NUMERIC NOT NULL DEFAULT 0;
