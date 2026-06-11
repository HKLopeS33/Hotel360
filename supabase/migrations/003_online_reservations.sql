-- Solicitações de reserva feitas online por hóspedes (sem login)
CREATE TABLE online_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  quantidade_pessoas INTEGER NOT NULL DEFAULT 1,
  tem_veiculo BOOLEAN NOT NULL DEFAULT false,
  quantidade_veiculos INTEGER,
  tem_pet BOOLEAN NOT NULL DEFAULT false,
  tem_cafe BOOLEAN NOT NULL DEFAULT false,
  tem_garagem BOOLEAN NOT NULL DEFAULT false,
  checkin_previsto DATE NOT NULL,
  checkout_previsto DATE NOT NULL,
  horario_chegada_previsto TIME,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE online_reservations ENABLE ROW LEVEL SECURITY;

-- Equipe do hotel: acesso total às solicitações do próprio hotel
CREATE POLICY "online_reservations_hotel" ON online_reservations
  FOR ALL USING (hotel_id = auth_hotel_id() OR is_master());

-- Hóspedes (anônimos): podem criar solicitações via link público de reserva
CREATE POLICY "online_reservations_public_insert" ON online_reservations
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE INDEX idx_online_reservations_hotel ON online_reservations(hotel_id, status);

-- Configurações de preço para reservas online, definidas pelo administrador do hotel
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_valor_diaria NUMERIC(10,2);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_valor_extra_pet NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_valor_extra_cafe NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS online_valor_extra_garagem NUMERIC(10,2) NOT NULL DEFAULT 0;
