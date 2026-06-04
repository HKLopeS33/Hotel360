import { createClient } from '@/lib/supabase/server'
import { requireMaster } from '@/lib/auth'
import { HotelsAdminClient } from './hotels-admin-client'

export default async function HoteisAdminPage() {
  await requireMaster()
  const supabase = await createClient()

  const [{ data: hotels }, { data: plans }] = await Promise.all([
    supabase.from('hotels').select('*, plan:plans(*)').order('created_at', { ascending: false }),
    supabase.from('plans').select('*').order('valor'),
  ])

  return <HotelsAdminClient hotels={hotels ?? []} plans={plans ?? []} />
}
