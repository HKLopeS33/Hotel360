import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/** Cliente com service role — bypass de RLS para consulta pública do status do pagamento */
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export async function GET(request: NextRequest) {
  const reservationId = request.nextUrl.searchParams.get('reservationId')
  if (!reservationId) {
    return NextResponse.json({ error: 'Parâmetro reservationId é obrigatório' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('online_reservations')
    .select('payment_status, status')
    .eq('id', reservationId)
    .single()

  if (!data) {
    return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
  }

  return NextResponse.json(data)
}
