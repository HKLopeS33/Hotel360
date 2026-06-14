-- Vincula a solicitação online à reserva criada (quando o quarto é atribuído)
ALTER TABLE online_reservations ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL;
