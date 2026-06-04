import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'master' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { userId, novaSenha } = await request.json()

  if (!userId || !novaSenha || novaSenha.length < 6) {
    return NextResponse.json({ error: 'userId e senha (mín. 6 caracteres) são obrigatórios' }, { status: 400 })
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: 'PUT',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: novaSenha }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.msg ?? 'Erro ao redefinir senha' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
