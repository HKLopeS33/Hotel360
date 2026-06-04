-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Plans
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  limite_quartos INTEGER NOT NULL DEFAULT 20,
  recursos JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (nome, valor, limite_quartos, recursos) VALUES
  ('Básico', 99.90, 20, '{"reservas_futuras": false, "calendario": false, "limpeza": false, "financeiro_basico": false, "financeiro_completo": false, "multiusuarios": false, "manutencao": false, "whatsapp": false, "pix": false, "api": false}'),
  ('Profissional', 199.90, 100, '{"reservas_futuras": true, "calendario": true, "limpeza": true, "financeiro_basico": true, "financeiro_completo": false, "multiusuarios": false, "manutencao": false, "whatsapp": false, "pix": false, "api": false}'),
  ('Premium', 399.90, -1, '{"reservas_futuras": true, "calendario": true, "limpeza": true, "financeiro_basico": true, "financeiro_completo": true, "multiusuarios": true, "manutencao": true, "whatsapp": true, "pix": true, "api": true}');

-- Hotels
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  logo_url TEXT,
  plano_id UUID REFERENCES plans(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'bloqueado')),
  data_vencimento DATE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES hotels(id),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'recepcionista' CHECK (role IN ('master', 'admin', 'recepcionista', 'camareira', 'manutencao')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  numero TEXT NOT NULL,
  nome TEXT,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'standard',
  capacidade INTEGER NOT NULL DEFAULT 2,
  diaria DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupado', 'reservado', 'limpeza', 'manutencao')),
  fotos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, numero)
);

-- Guests
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  nacionalidade TEXT DEFAULT 'Brasileiro(a)',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) NOT NULL,
  guest_id UUID REFERENCES guests(id) NOT NULL,
  checkin_previsto DATE NOT NULL,
  checkout_previsto DATE NOT NULL,
  quantidade_pessoas INTEGER NOT NULL DEFAULT 1,
  valor_diaria DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'criada' CHECK (status IN ('criada', 'confirmada', 'checkin', 'hospedado', 'checkout', 'cancelada')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stays
CREATE TABLE stays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES reservations(id) NOT NULL,
  checkin_real TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkout_real TIMESTAMPTZ,
  responsavel_checkin TEXT,
  responsavel_checkout TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES reservations(id) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'estornado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cleaning Tasks
CREATE TABLE cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_limpeza', 'limpo', 'inspecionado')),
  responsavel TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Tasks
CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id),
  descricao TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'concluido')),
  responsavel TEXT,
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  data_conclusao DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at for cleaning_tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cleaning_tasks_updated_at
  BEFORE UPDATE ON cleaning_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'recepcionista'));
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===================== ROW LEVEL SECURITY =====================

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's hotel_id
CREATE OR REPLACE FUNCTION auth_hotel_id()
RETURNS UUID AS $$
  SELECT hotel_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: is current user master?
CREATE OR REPLACE FUNCTION is_master()
RETURNS BOOLEAN AS $$
  SELECT role = 'master' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Plans: public read
CREATE POLICY "plans_read" ON plans FOR SELECT USING (true);

-- Hotels: master sees all, others see own
CREATE POLICY "hotels_master" ON hotels FOR ALL USING (is_master());
CREATE POLICY "hotels_own" ON hotels FOR SELECT USING (id = auth_hotel_id());

-- Profiles: master sees all, user sees own hotel
CREATE POLICY "profiles_master" ON profiles FOR ALL USING (is_master());
CREATE POLICY "profiles_own_hotel" ON profiles FOR SELECT USING (hotel_id = auth_hotel_id());
CREATE POLICY "profiles_self" ON profiles FOR UPDATE USING (id = auth.uid());

-- All hotel tables: filter by hotel_id
CREATE POLICY "rooms_hotel" ON rooms FOR ALL USING (hotel_id = auth_hotel_id() OR is_master());
CREATE POLICY "guests_hotel" ON guests FOR ALL USING (hotel_id = auth_hotel_id() OR is_master());
CREATE POLICY "reservations_hotel" ON reservations FOR ALL USING (hotel_id = auth_hotel_id() OR is_master());
CREATE POLICY "stays_hotel" ON stays FOR ALL USING (hotel_id = auth_hotel_id() OR is_master());
CREATE POLICY "payments_hotel" ON payments FOR ALL USING (hotel_id = auth_hotel_id() OR is_master());
CREATE POLICY "cleaning_hotel" ON cleaning_tasks FOR ALL USING (hotel_id = auth_hotel_id() OR is_master());
CREATE POLICY "maintenance_hotel" ON maintenance_tasks FOR ALL USING (hotel_id = auth_hotel_id() OR is_master());

-- Indexes
CREATE INDEX idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX idx_guests_hotel ON guests(hotel_id);
CREATE INDEX idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX idx_reservations_status ON reservations(hotel_id, status);
CREATE INDEX idx_stays_hotel ON stays(hotel_id);
CREATE INDEX idx_payments_hotel ON payments(hotel_id);
CREATE INDEX idx_cleaning_hotel ON cleaning_tasks(hotel_id);
CREATE INDEX idx_maintenance_hotel ON maintenance_tasks(hotel_id);
