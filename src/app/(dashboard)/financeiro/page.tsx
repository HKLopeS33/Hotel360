import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { requireAccess } from '@/lib/access'
import { FinanceiroClient } from './financeiro-client'

export default async function FinanceiroPage() {
  const profile = await requireProfile()
  requireAccess(profile, 'financeiro')
  const supabase = await createClient()

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: payments } = await supabase
    .from('payments')
    .select('*, reservation:reservations(checkin_previsto, checkout_previsto, guest:guests(nome), room:rooms(numero))')
    .eq('hotel_id', profile.hotel_id!)
    .gte('created_at', startOfMonth)
    .order('created_at', { ascending: false })

  return <FinanceiroClient payments={payments ?? []} />
}
