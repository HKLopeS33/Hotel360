export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PlanName = 'basico' | 'profissional' | 'premium'
export type HotelStatus = 'ativo' | 'suspenso' | 'bloqueado'
export type UserRole = 'master' | 'admin' | 'recepcionista' | 'camareira' | 'manutencao'
export type UserStatus = 'ativo' | 'inativo'
export type RoomStatus = 'livre' | 'ocupado' | 'reservado' | 'limpeza' | 'manutencao'
export type ReservationStatus = 'criada' | 'confirmada' | 'checkin' | 'hospedado' | 'checkout' | 'cancelada'
export type CleaningStatus = 'aguardando' | 'em_limpeza' | 'limpo' | 'inspecionado'
export type MaintenanceStatus = 'aberto' | 'em_andamento' | 'concluido'
export type MaintenancePriority = 'baixa' | 'media' | 'alta' | 'urgente'
export type PaymentMethod = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia'
export type PaymentStatus = 'pendente' | 'pago' | 'cancelado' | 'estornado'
export type OnlineReservationStatus = 'pendente' | 'aprovada' | 'recusada'
export type OnlinePaymentStatus = 'pendente' | 'pago' | 'reembolsado' | 'falhou'

export interface Plan {
  id: string
  nome: string
  valor: number
  limite_quartos: number
  recursos: Json
  created_at: string
}

export interface Hotel {
  id: string
  nome: string
  cnpj?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  logo_url?: string | null
  plano_id: string
  status: HotelStatus
  data_vencimento: string
  created_at: string
  online_valor_diaria?: number | null
  online_valor_extra_pet?: number
  online_valor_extra_cafe?: number
  online_valor_extra_garagem?: number
  online_valor_extra_veiculo?: number
  online_quartos_fotos?: Record<string, string[]>
  mp_access_token?: string | null
  mp_public_key?: string | null
  online_taxa_cancelamento_pct?: number
  politica_agendamento?: string | null
  politica_pagamento?: string | null
  politica_cancelamento?: string | null
  valor_hora_inicial?: number
  valor_hora_adicional?: number
  beta_tester?: boolean
  plan?: Plan
}

export interface Profile {
  id: string
  hotel_id?: string | null
  nome: string
  email: string
  role: UserRole
  status: UserStatus
  avatar_url?: string
  created_at: string
  hotel?: Hotel
}

export interface Room {
  id: string
  hotel_id: string
  numero: string
  nome?: string
  descricao?: string
  categoria: string
  capacidade: number
  diaria: number
  status: RoomStatus
  fotos?: string[]
  created_at: string
}

export interface Guest {
  id: string
  hotel_id: string
  nome: string
  cpf?: string
  rg?: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  nacionalidade?: string
  observacoes?: string
  tem_veiculo: boolean
  placa_veiculo?: string | null
  documento_url?: string | null
  created_at: string
}

export interface Reservation {
  id: string
  hotel_id: string
  room_id: string
  guest_id: string
  checkin_previsto: string
  checkout_previsto: string
  checkin_hora_prevista?: string | null
  quantidade_pessoas: number
  valor_diaria: number
  valor_total: number
  status: ReservationStatus
  observacoes?: string
  tem_veiculo: boolean
  quantidade_veiculos?: number | null
  tem_pet: boolean
  quantidade_pets?: number | null
  tem_cafe: boolean
  tipo_reserva: 'diaria' | 'hora'
  quantidade_horas?: number | null
  checkout_hora_prevista?: string | null
  created_at: string
  room?: Room
  guest?: Guest
}

export interface OnlineReservation {
  id: string
  hotel_id: string
  nome: string
  cpf?: string | null
  rg?: string | null
  telefone: string
  email?: string | null
  quantidade_pessoas: number
  tem_veiculo: boolean
  quantidade_veiculos?: number | null
  tem_pet: boolean
  tem_cafe: boolean
  tem_garagem: boolean
  tipo_quarto?: string | null
  checkin_previsto: string
  checkout_previsto: string
  horario_chegada_previsto?: string | null
  observacoes?: string | null
  status: OnlineReservationStatus
  valor_total?: number | null
  aceite_politicas: boolean
  payment_status: OnlinePaymentStatus
  forma_pagamento?: string | null
  mp_payment_id?: string | null
  created_at: string
}

export interface Stay {
  id: string
  hotel_id: string
  reservation_id: string
  checkin_real: string
  checkout_real?: string
  responsavel_checkin?: string
  responsavel_checkout?: string
  created_at: string
  reservation?: Reservation
}

export interface Payment {
  id: string
  hotel_id: string
  reservation_id: string
  valor: number
  forma_pagamento: PaymentMethod
  status: PaymentStatus
  observacoes?: string
  created_at: string
  reservation?: Reservation
}

export interface CleaningTask {
  id: string
  hotel_id: string
  room_id: string
  status: CleaningStatus
  responsavel?: string
  observacoes?: string
  created_at: string
  updated_at: string
  room?: Room
}

export interface MaintenanceTask {
  id: string
  hotel_id: string
  room_id?: string
  descricao: string
  prioridade: MaintenancePriority
  status: MaintenanceStatus
  responsavel?: string
  data_abertura: string
  data_conclusao?: string
  created_at: string
  room?: Room
}

export interface Database {
  public: {
    Tables: {
      plans: { Row: Plan; Insert: Omit<Plan, 'id' | 'created_at'>; Update: Partial<Omit<Plan, 'id' | 'created_at'>> }
      hotels: { Row: Hotel; Insert: Omit<Hotel, 'id' | 'created_at'>; Update: Partial<Omit<Hotel, 'id' | 'created_at'>> }
      profiles: { Row: Profile; Insert: Omit<Profile, 'id' | 'created_at'>; Update: Partial<Omit<Profile, 'id' | 'created_at'>> }
      rooms: { Row: Room; Insert: Omit<Room, 'id' | 'created_at'>; Update: Partial<Omit<Room, 'id' | 'created_at'>> }
      guests: { Row: Guest; Insert: Omit<Guest, 'id' | 'created_at'>; Update: Partial<Omit<Guest, 'id' | 'created_at'>> }
      reservations: { Row: Reservation; Insert: Omit<Reservation, 'id' | 'created_at'>; Update: Partial<Omit<Reservation, 'id' | 'created_at'>> }
      online_reservations: { Row: OnlineReservation; Insert: Omit<OnlineReservation, 'id' | 'created_at'>; Update: Partial<Omit<OnlineReservation, 'id' | 'created_at'>> }
      stays: { Row: Stay; Insert: Omit<Stay, 'id' | 'created_at'>; Update: Partial<Omit<Stay, 'id' | 'created_at'>> }
      payments: { Row: Payment; Insert: Omit<Payment, 'id' | 'created_at'>; Update: Partial<Omit<Payment, 'id' | 'created_at'>> }
      cleaning_tasks: { Row: CleaningTask; Insert: Omit<CleaningTask, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<CleaningTask, 'id' | 'created_at'>> }
      maintenance_tasks: { Row: MaintenanceTask; Insert: Omit<MaintenanceTask, 'id' | 'created_at'>; Update: Partial<Omit<MaintenanceTask, 'id' | 'created_at'>> }
    }
  }
}
