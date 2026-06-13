import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { ReservasOnlineClient } from './reservas-online-client'

export default async function ReservasOnlinePage() {
  const profile = await requireProfile()
  if (!profile.hotel?.beta_tester) redirect('/dashboard')

  const supabase = await createClient()

  const [{ data: onlineReservations }, { data: rooms }, { data: guests }] = await Promise.all([
    supabase.from('online_reservations').select('*').eq('hotel_id', profile.hotel_id!).order('created_at', { ascending: false }),
    supabase.from('rooms').select('id,numero,nome,diaria,status').eq('hotel_id', profile.hotel_id!).order('numero'),
    supabase.from('guests').select('id,nome,cpf,telefone').eq('hotel_id', profile.hotel_id!).order('nome'),
  ])

  return (
    <ReservasOnlineClient
      onlineReservations={onlineReservations ?? []}
      rooms={rooms ?? []}
      guests={guests ?? []}
      hotelId={profile.hotel_id!}
      canEditSettings={profile.role === 'master' || profile.role === 'admin'}
      pricing={{
        online_valor_diaria: profile.hotel?.online_valor_diaria ?? null,
        online_valor_extra_pet: profile.hotel?.online_valor_extra_pet ?? 0,
        online_valor_extra_cafe: profile.hotel?.online_valor_extra_cafe ?? 0,
        online_valor_extra_garagem: profile.hotel?.online_valor_extra_garagem ?? 0,
        online_valor_extra_veiculo: profile.hotel?.online_valor_extra_veiculo ?? 0,
        online_taxa_cancelamento_pct: profile.hotel?.online_taxa_cancelamento_pct ?? 0,
        politica_agendamento: profile.hotel?.politica_agendamento ?? null,
        politica_pagamento: profile.hotel?.politica_pagamento ?? null,
        politica_cancelamento: profile.hotel?.politica_cancelamento ?? null,
      }}
      quartosFotos={profile.hotel?.online_quartos_fotos ?? {}}
      betaFeatures={profile.hotel?.beta_tester ?? false}
    />
  )
}
