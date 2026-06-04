import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { requireAccess } from '@/lib/access'
import { MaintenanceClient } from './maintenance-client'

export default async function ManutencaoPage() {
  const profile = await requireProfile()
  requireAccess(profile, 'manutencao')
  const supabase = await createClient()

  const [{ data: tasks }, { data: rooms }] = await Promise.all([
    supabase.from('maintenance_tasks').select('*, room:rooms(numero,nome)').eq('hotel_id', profile.hotel_id!).order('created_at', { ascending: false }),
    supabase.from('rooms').select('id,numero,nome').eq('hotel_id', profile.hotel_id!).order('numero'),
  ])

  return <MaintenanceClient tasks={tasks ?? []} rooms={rooms ?? []} hotelId={profile.hotel_id!} />
}
