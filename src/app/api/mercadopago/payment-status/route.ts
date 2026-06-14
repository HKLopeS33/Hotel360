import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { MercadoPagoConfig, Payment } from 'mercadopago'

/** Cliente com service role — bypass de RLS para consulta pública do status do pagamento */
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

export async function GET(request: NextRequest) {
  const reservationId = request.nextUrl.searchParams.get('reservationId')
  if (!reservationId) {
    return NextResponse.json({ error: 'Parâmetro reservationId é obrigatório' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('online_reservations')
    .select('payment_status, status, mp_payment_id, hotel_id')
    .eq('id', reservationId)
    .single()

  if (!data) {
    return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
  }

  // Caso o webhook do Mercado Pago ainda não tenha confirmado, consulta direto a API
  // como fallback (ex: webhook não configurado/atrasado).
  if (data.payment_status === 'pendente' && data.mp_payment_id) {
    const { data: hotel } = await supabase
      .from('hotels')
      .select('mp_access_token')
      .eq('id', data.hotel_id)
      .single()

    if (hotel?.mp_access_token) {
      try {
        const client = new MercadoPagoConfig({ accessToken: hotel.mp_access_token })
        const result = await new Payment(client).get({ id: data.mp_payment_id })
        const paymentStatus = PAYMENT_STATUS_MAP[result.status ?? ''] ?? 'pendente'

        if (paymentStatus !== data.payment_status) {
          const newStatus = paymentStatus === 'pago' && data.status === 'pendente' ? 'aprovada' : data.status
          await supabase
            .from('online_reservations')
            .update({ payment_status: paymentStatus, status: newStatus })
            .eq('id', reservationId)

          return NextResponse.json({ payment_status: paymentStatus, status: newStatus })
        }
      } catch {
        // mantém o status atual em caso de falha na consulta
      }
    }
  }

  return NextResponse.json({ payment_status: data.payment_status, status: data.status })
}
