import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { MercadoPagoConfig, Payment } from 'mercadopago'

/** Cliente com service role — bypass de RLS para acesso aos dados da reserva/hotel */
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
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { reservationId, hotelId, formData } = body

  if (!reservationId || !hotelId || !formData) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: reservation } = await supabase
    .from('online_reservations')
    .select('id, hotel_id, valor_total, nome, email')
    .eq('id', reservationId)
    .eq('hotel_id', hotelId)
    .single()

  if (!reservation) {
    return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('mp_access_token')
    .eq('id', hotelId)
    .single()

  if (!hotel?.mp_access_token) {
    return NextResponse.json({ error: 'Hotel não configurou pagamento online' }, { status: 400 })
  }

  const valorTotal = reservation.valor_total ?? formData.transaction_amount
  if (!valorTotal) {
    return NextResponse.json({ error: 'Valor da reserva inválido' }, { status: 400 })
  }

  const client = new MercadoPagoConfig({ accessToken: hotel.mp_access_token })
  const payment = new Payment(client)

  try {
    const result = await payment.create({
      body: {
        transaction_amount: Number(valorTotal),
        token: formData.token,
        description: `Reserva online - ${reservation.nome}`,
        installments: formData.installments ?? 1,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        payer: {
          email: formData.payer?.email ?? reservation.email ?? undefined,
          identification: formData.payer?.identification,
        },
      },
      requestOptions: { idempotencyKey: `${reservationId}-${Date.now()}` },
    })

    const paymentStatus = PAYMENT_STATUS_MAP[result.status ?? ''] ?? 'pendente'

    await supabase
      .from('online_reservations')
      .update({
        payment_status: paymentStatus,
        mp_payment_id: String(result.id),
        forma_pagamento: formData.payment_method_id,
      })
      .eq('id', reservationId)

    return NextResponse.json({
      status: result.status,
      status_detail: result.status_detail,
      id: result.id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao processar pagamento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
