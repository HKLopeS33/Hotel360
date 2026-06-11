-- Veículos, pets e café da manhã também para reservas criadas manualmente
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS tem_veiculo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS quantidade_veiculos INT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS tem_pet BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS quantidade_pets INT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS tem_cafe BOOLEAN NOT NULL DEFAULT false;
