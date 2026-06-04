import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { requireAccess } from '@/lib/access'
import { CleaningClient } from './cleaning-client'

export default async function LimpezaPage() {
  const profile = await requireProfile()
  requireAccess(profile, 'limpeza')
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from('cleaning_tasks')
    .select('*, room:rooms(numero,nome,categoria)')
    .eq('hotel_id', profile.hotel_id!)
    .order('created_at', { ascending: false })

  return <CleaningClient tasks={tasks ?? []} hotelId={profile.hotel_id!} />
}
