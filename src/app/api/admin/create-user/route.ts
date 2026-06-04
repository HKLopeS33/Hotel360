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
  // 1. Verifica quem está chamando (usa anon key do usuário logado)
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

  const { nome, email, senha, hotel_id, role } = await request.json()

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
  }

  if (senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  // Admin só cria usuários no próprio hotel; master pode definir qualquer hotel
  const finalHotelId = callerProfile.role === 'admin'
    ? callerProfile.hotel_id
    : (hotel_id || null)

  // 2. Criar usuário no Auth com service role key
  const authRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, role },
    }),
  })

  const authData = await authRes.json()

  if (!authRes.ok) {
    const msg = authData.msg ?? authData.message ?? authData.error_description ?? 'Erro ao criar usuário'
    // Mensagem amigável para e-mail já existente
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema' }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const newUserId = authData.id

  // 3. Atualizar perfil com service role (bypass de RLS)
  //    O trigger handle_new_user já criou o perfil — agora definimos hotel_id, role e nome corretos
  const adminClient = createAdminClient()
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({
      nome,
      hotel_id: finalHotelId,
      role,
      status: 'ativo',
    })
    .eq('id', newUserId)

  if (updateError) {
    console.error('Erro ao atualizar perfil:', updateError)
    // Não falha o request — o usuário foi criado, apenas o perfil pode estar incompleto
  }

  return NextResponse.json({ id: newUserId, email, nome })
}
