import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { CheckoutClient } from './checkout-client'

export default async function CheckoutPage() {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, room:rooms(id,numero,nome), guest:guests(id,nome,cpf,telefone)')
    .eq('hotel_id', profile.hotel_id!)
    .eq('status', 'hospedado')
    .order('checkout_previsto')

  return <CheckoutClient reservations={reservations ?? []} profile={profile} />
}
