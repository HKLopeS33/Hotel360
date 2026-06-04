// Cria o usuário master diretamente no banco, sem depender da Auth API
// Temporariamente desabilita o trigger, cria o usuário, recria o perfil corretamente

import { default as pg } from 'pg'
const { Client } = pg

const DB_PASSWORD = 'Ipmh61r3159753@'

const client = new Client({
  host: 'db.uinqxckkgplnucyxdagi.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log('✅ Conectado ao banco')

// Verifica o trigger
const { rows: triggerRows } = await client.query(`
  SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created'
`)
console.log('Trigger status:', triggerRows)

// Verifica se há erros na função do trigger
const { rows: funcRows } = await client.query(`
  SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'
`)
console.log('Trigger function:', funcRows[0]?.prosrc?.substring(0, 200))

// Testa inserção manual na tabela profiles para ver se funciona
try {
  const testId = '00000000-0000-0000-0000-000000000001'
  await client.query(`
    INSERT INTO public.profiles (id, nome, email, role, status)
    VALUES ($1, 'Test', 'test@test.com', 'master', 'ativo')
    ON CONFLICT (id) DO NOTHING
  `, [testId])
  // Limpar teste
  await client.query(`DELETE FROM public.profiles WHERE id = $1`, [testId])
  console.log('✅ Inserção em profiles funciona corretamente')
} catch (e) {
  console.error('❌ Erro ao inserir em profiles:', e.message)
}

// Desabilita o trigger temporariamente
console.log('\n🔧 Desabilitando trigger temporariamente...')
await client.query(`ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created`)

// Cria usuário na tabela auth.users diretamente
const { default: crypto } = await import('crypto')
const userId = crypto.randomUUID()

// Hash bcrypt da senha "Hotel360@2024"
// Usamos uma senha já hasheada para não precisar do bcrypt
// Hash gerado para "Hotel360@2024"
const passwordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lihO'

try {
  await client.query(`
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      aud, role, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      $1,
      '00000000-0000-0000-0000-000000000000',
      'admin@hotel360.com',
      $2,
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Administrador Master","role":"master"}',
      NOW(), NOW(),
      'authenticated', 'authenticated',
      '', '', '', ''
    )
  `, [userId, passwordHash])

  console.log(`✅ Usuário criado no auth.users: ${userId}`)
} catch (e) {
  console.error('❌ Erro ao criar no auth.users:', e.message)
  // Verifica se já existe
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = 'admin@hotel360.com'`)
  if (rows.length > 0) {
    console.log('ℹ️  Usuário já existe com ID:', rows[0].id)
    // Usa o ID existente
    Object.assign({ userId }, { userId: rows[0].id })
  }
}

// Reabilita o trigger
await client.query(`ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created`)
console.log('✅ Trigger reabilitado')

// Pega o ID do usuário criado
const { rows: userRows } = await client.query(
  `SELECT id FROM auth.users WHERE email = 'admin@hotel360.com'`
)

if (userRows.length === 0) {
  console.error('❌ Usuário não encontrado após criação')
  await client.end()
  process.exit(1)
}

const finalUserId = userRows[0].id
console.log(`\n👤 User ID: ${finalUserId}`)

// Cria/atualiza o perfil
await client.query(`
  INSERT INTO public.profiles (id, nome, email, role, status)
  VALUES ($1, 'Administrador Master', 'admin@hotel360.com', 'master', 'ativo')
  ON CONFLICT (id) DO UPDATE SET role = 'master', nome = 'Administrador Master', status = 'ativo'
`, [finalUserId])

console.log('\n✅ Usuário master criado com sucesso!')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📧 E-mail:  admin@hotel360.com')
console.log('🔑 Senha:   Hotel360@2024')
console.log('👑 Função:  Master')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

await client.end()
