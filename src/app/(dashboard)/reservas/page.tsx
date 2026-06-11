import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { ReservationsClient } from './reservations-client'

export default async function ReservasPage() {
  const profile = await requireProfile()
  const supabase = await createClient()

  const [{ data: reservations }, { data: rooms }, { data: guests }] = await Promise.all([
    supabase.from('reservations').select('*, room:rooms(id,numero,nome,diaria), guest:guests(id,nome,cpf,telefone)').eq('hotel_id', profile.hotel_id!).order('created_at', { ascending: false }),
    supabase.from('rooms').select('id,numero,nome,diaria,status').eq('hotel_id', profile.hotel_id!).order('numero'),
    supabase.from('guests').select('id,nome,cpf,telefone').eq('hotel_id', profile.hotel_id!).order('nome'),
  ])

  return (
    <ReservationsClient
      reservations={reservations ?? []}
      rooms={rooms ?? []}
      guests={guests ?? []}
      hotelId={profile.hotel_id!}
      valorCafePorPessoa={profile.hotel?.online_valor_extra_cafe ?? 0}
      valorHoraInicial={profile.hotel?.valor_hora_inicial ?? 50}
      valorHoraAdicional={profile.hotel?.valor_hora_adicional ?? 0}
      canEditSettings={profile.role === 'master' || profile.role === 'admin'}
      betaFeatures={profile.hotel?.beta_tester ?? false}
    />
  )
}
