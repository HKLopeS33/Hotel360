import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://uinqxckkgplnucyxdagi.supabase.co'
const SERVICE_KEY = 'sb_secret_07qrNuL3UmHoYiTOQ9n74A_HU9hWaI0'
const DB_PASSWORD = process.env.DB_PASSWORD || 'Ipmh61r3159753@'

// 1. Create user via Auth Admin API
async function createAuthUser() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@hotel360.com',
      password: 'Hotel360@2024',
      email_confirm: true,
      user_metadata: { nome: 'Administrador Master', role: 'master' },
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('Auth API error:', JSON.stringify(data, null, 2))
    return null
  }
  return data
}

// 2. Fix profile via direct DB connection
async function fixProfile(userId) {
  const { default: pg } = await import('pg')
  const { Client } = pg

  const client = new Client({
    host: 'db.uinqxckkgplnucyxdagi.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  // Upsert profile with master role
  await client.query(`
    INSERT INTO public.profiles (id, nome, email, role, status)
    VALUES ($1, 'Administrador Master', 'admin@hotel360.com', 'master', 'ativo')
    ON CONFLICT (id) DO UPDATE SET role = 'master', nome = 'Administrador Master', status = 'ativo'
  `, [userId])

  const { rows } = await client.query(
    `SELECT id, nome, email, role FROM public.profiles WHERE id = $1`, [userId]
  )
  await client.end()
  return rows[0]
}

// 3. Check if user already exists
async function getUserByEmail() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=admin@hotel360.com`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data?.users?.[0] ?? null
}

console.log('🔍 Verificando se usuário master já existe...')
let user = await getUserByEmail()

if (user) {
  console.log('⚠️  Usuário já existe, atualizando perfil...')
} else {
  console.log('👤 Criando usuário master...')
  user = await createAuthUser()
  if (!user) {
    console.log('\n⚠️  Falha na Auth API. Tentando criar perfil diretamente pelo ID do banco...')
  }
}

if (user?.id) {
  console.log(`✅ Usuário Auth criado/encontrado: ${user.id}`)
  console.log('🔧 Configurando perfil como master...')
  const profile = await fixProfile(user.id)
  console.log('\n✅ Usuário master configurado com sucesso!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 E-mail:  admin@hotel360.com')
  console.log('🔑 Senha:   Hotel360@2024')
  console.log('👑 Função:  Master')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
} else {
  console.error('❌ Não foi possível criar o usuário via API.')
  console.log('\nCrie manualmente no Supabase Dashboard:')
  console.log('  Authentication > Users > Add user')
  console.log('  Email: admin@hotel360.com')
  console.log('  Password: Hotel360@2024')
  console.log('\nDepois rode o SQL no SQL Editor:')
  console.log(`  INSERT INTO public.profiles (id, nome, email, role, status)
  VALUES ('<USER_ID>', 'Administrador Master', 'admin@hotel360.com', 'master', 'ativo')
  ON CONFLICT (id) DO UPDATE SET role = 'master';`)
}
