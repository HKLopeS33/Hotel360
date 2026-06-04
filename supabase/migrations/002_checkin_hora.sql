-- Add expected check-in time to reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS checkin_hora_prevista TIME;
