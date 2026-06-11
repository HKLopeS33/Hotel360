import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { MercadoPagoConfig, PaymentRefund } from 'mercadopago'

/** Cliente com service role — bypass de RLS */
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, hotel_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile || (callerProfile.role !== 'master' && callerProfile.role !== 'admin')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { reservationId } = await request.json()
  if (!reservationId) {
    return NextResponse.json({ error: 'Reserva não informada' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: reservation } = await adminClient
    .from('online_reservations')
    .select('id, hotel_id, valor_total, payment_status, mp_payment_id')
    .eq('id', reservationId)
    .single()

  if (!reservation || reservation.hotel_id !== callerProfile.hotel_id) {
    if (callerProfile.role !== 'master' || !reservation) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    }
  }

  if (reservation.payment_status !== 'pago' || !reservation.mp_payment_id) {
    return NextResponse.json({ error: 'Esta reserva não possui pagamento confirmado' }, { status: 400 })
  }

  const { data: hotel } = await adminClient
    .from('hotels')
    .select('mp_access_token, online_taxa_cancelamento_pct')
    .eq('id', reservation.hotel_id)
    .single()

  if (!hotel?.mp_access_token) {
    return NextResponse.json({ error: 'Hotel não configurou pagamento online' }, { status: 400 })
  }

  const taxaPct = hotel.online_taxa_cancelamento_pct ?? 0
  const valorTotal = reservation.valor_total ?? 0
  const valorReembolso = Math.round(valorTotal * (1 - taxaPct / 100) * 100) / 100

  const client = new MercadoPagoConfig({ accessToken: hotel.mp_access_token })
  const refund = new PaymentRefund(client)

  try {
    await refund.create({
      payment_id: reservation.mp_payment_id,
      body: valorReembolso < valorTotal ? { amount: valorReembolso } : undefined,
    })

    await adminClient
      .from('online_reservations')
      .update({ payment_status: 'reembolsado', status: 'recusada' })
      .eq('id', reservationId)

    return NextResponse.json({ ok: true, valorReembolso, taxaPct })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao processar reembolso'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
