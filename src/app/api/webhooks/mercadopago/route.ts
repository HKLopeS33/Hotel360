import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { MercadoPagoConfig, Payment } from 'mercadopago'

/** Cliente com service role — bypass de RLS */
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

const PAYMENT_STATUS_MAP: Record<string, string> = {
  approved: 'pago',
  pending: 'pendente',
  in_process: 'pendente',
  rejected: 'falhou',
  cancelled: 'falhou',
  refunded: 'reembolsado',
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const body = await request.json().catch(() => ({}))

  const type = url.searchParams.get('type') ?? body.type ?? body.topic
  const paymentId = url.searchParams.get('data.id') ?? body.data?.id ?? body.id

  if (type !== 'payment' || !paymentId) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createAdminClient()

  const { data: reservation } = await supabase
    .from('online_reservations')
    .select('id, hotel_id')
    .eq('mp_payment_id', String(paymentId))
    .maybeSingle()

  if (!reservation) {
    return NextResponse.json({ ok: true })
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('mp_access_token')
    .eq('id', reservation.hotel_id)
    .single()

  if (!hotel?.mp_access_token) {
    return NextResponse.json({ ok: true })
  }

  const client = new MercadoPagoConfig({ accessToken: hotel.mp_access_token })
  const payment = new Payment(client)

  try {
    const result = await payment.get({ id: String(paymentId) })
    const paymentStatus = PAYMENT_STATUS_MAP[result.status ?? ''] ?? 'pendente'

    await supabase
      .from('online_reservations')
      .update({ payment_status: paymentStatus })
      .eq('id', reservation.id)
  } catch {
    // Notificação será reenviada pelo Mercado Pago em caso de falha
  }

  return NextResponse.json({ ok: true })
}
