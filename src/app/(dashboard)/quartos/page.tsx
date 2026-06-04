import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { RoomsClient } from './rooms-client'

export default async function QuartosPage() {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('hotel_id', profile.hotel_id!)
    .order('numero')

  return <RoomsClient rooms={rooms ?? []} hotelId={profile.hotel_id!} />
}
