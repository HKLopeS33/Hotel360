import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { CheckinClient } from './checkin-client'

export default async function CheckinPage() {
  const profile = await requireProfile()
  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select('*, room:rooms(id,numero,nome), guest:guests(id,nome,cpf,telefone)')
    .eq('hotel_id', profile.hotel_id!)
    .in('status', ['confirmada', 'criada'])

  if (!profile.hotel?.beta_tester) {
    query = query.lte('checkin_previsto', new Date().toISOString().split('T')[0])
  }

  const { data: reservations } = await query.order('checkin_previsto')

  return <CheckinClient reservations={reservations ?? []} profile={profile} />
}
