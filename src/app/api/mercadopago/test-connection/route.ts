import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('hotel_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.hotel_id || (profile.role !== 'master' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('mp_access_token')
    .eq('id', profile.hotel_id)
    .single()

  if (!hotel?.mp_access_token) {
    return NextResponse.json({ error: 'Access Token não configurado' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${hotel.mp_access_token}` },
    })
    const data = await res.json()

    if (!res.ok) {
      const msg = data.message ?? data.error ?? 'Token inválido'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      nickname: data.nickname,
      site_id: data.site_id,
      email: data.email,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao conectar com o Mercado Pago' }, { status: 500 })
  }
}
