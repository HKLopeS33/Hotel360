import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { GuestsClient } from './guests-client'

export default async function HospedesPage() {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .eq('hotel_id', profile.hotel_id!)
    .order('nome')

  return <GuestsClient guests={guests ?? []} hotelId={profile.hotel_id!} />
}
