-- Permite identificar solicitações que não exigem pagamento online
-- (hotel sem Mercado Pago configurado ou sem diária definida), para que
-- o painel possa esconder solicitações com pagamento pendente até a
-- confirmação do Mercado Pago.
ALTER TABLE online_reservations DROP CONSTRAINT IF EXISTS online_reservations_payment_status_check;
ALTER TABLE online_reservations ADD CONSTRAINT online_reservations_payment_status_check
  CHECK (payment_status IN ('pendente', 'pago', 'reembolsado', 'falhou', 'nao_exigido'));
