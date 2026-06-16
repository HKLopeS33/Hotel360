-- Adiciona quantidade de quartos solicitados na reserva online
ALTER TABLE online_reservations
  ADD COLUMN IF NOT EXISTS quantidade_quartos SMALLINT NOT NULL DEFAULT 1;
