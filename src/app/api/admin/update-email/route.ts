import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

/** Cliente com service role — bypass total de RLS */
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || (callerProfile.role !== 'master' && callerProfile.role !== 'admin')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  // 1. Atualiza o e-mail no Auth com service role
  const authRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, email_confirm: true }),
  })

  const authData = await authRes.json()

  if (!authRes.ok) {
    const msg = authData.msg ?? authData.message ?? authData.error_description ?? 'Erro ao alterar e-mail'
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
      return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 2. Atualiza o e-mail no perfil para refletir no painel de usuários
  const adminClient = createAdminClient()
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ email })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'E-mail alterado no login, mas houve um erro ao atualizar o perfil: ' + updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email })
}
