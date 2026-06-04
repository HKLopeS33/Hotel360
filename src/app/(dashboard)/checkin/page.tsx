import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { CheckinClient } from './checkin-client'

export default async function CheckinPage() {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, room:rooms(id,numero,nome), guest:guests(id,nome,cpf,telefone)')
    .eq('hotel_id', profile.hotel_id!)
    .in('status', ['confirmada', 'criada'])
    .lte('checkin_previsto', new Date().toISOString().split('T')[0])
    .order('checkin_previsto')

  return <CheckinClient reservations={reservations ?? []} profile={profile} />
}
