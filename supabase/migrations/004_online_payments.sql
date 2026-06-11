-- Credenciais do Mercado Pago e políticas/configurações de reserva online,
-- definidas pelo administrador do hotel
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS mp_access_token TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS mp_public_key TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_taxa_cancelamento_pct NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS politica_agendamento TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS politica_pagamento TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS politica_cancelamento TEXT;

-- Pagamento e aceite de políticas da solicitação de reserva online
ALTER TABLE online_reservations ADD COLUMN IF NOT EXISTS valor_total NUMERIC(10,2);
ALTER TABLE online_reservations ADD COLUMN IF NOT EXISTS aceite_politicas BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE online_reservations ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendente'
  CHECK (payment_status IN ('pendente', 'pago', 'reembolsado', 'falhou'));
ALTER TABLE online_reservations ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE online_reservations ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- Atualizações de status de pagamento (processamento e webhook) são feitas
-- pelo backend com a service role key, que ignora RLS — nenhuma policy
-- adicional de UPDATE para o papel anon é necessária.
