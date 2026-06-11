-- Reservas por hora (ex: pernoite/diária ou estadia avulsa cobrada por hora)
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS valor_hora_inicial NUMERIC(10,2) NOT NULL DEFAULT 50;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS valor_hora_adicional NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS tipo_reserva TEXT NOT NULL DEFAULT 'diaria'
  CHECK (tipo_reserva IN ('diaria', 'hora'));
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS quantidade_horas INT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS checkout_hora_prevista TIME;
