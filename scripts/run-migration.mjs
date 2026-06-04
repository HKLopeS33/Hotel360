import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Supabase connection via pg
// Password needed: get from Supabase Dashboard > Project Settings > Database > Database password
const DB_PASSWORD = process.env.DB_PASSWORD

if (!DB_PASSWORD) {
  console.error('❌ Defina a variável DB_PASSWORD com a senha do banco de dados do Supabase')
  console.error('   Exemplo: DB_PASSWORD=minha_senha node scripts/run-migration.mjs')
  console.error('')
  console.error('   Encontre a senha em: Supabase Dashboard > Project Settings > Database > Database password')
  process.exit(1)
}

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

const sqlPath = join(__dirname, '../supabase/migrations/001_initial_schema.sql')
const sql = readFileSync(sqlPath, 'utf8')

try {
  console.log('🔌 Conectando ao banco de dados...')
  await client.connect()
  console.log('✅ Conectado!')

  console.log('🚀 Executando migration...')
  await client.query(sql)
  console.log('✅ Migration executada com sucesso!')

  // Verify tables were created
  const { rows } = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `)
  console.log('\n📊 Tabelas criadas:')
  rows.forEach(r => console.log('  -', r.tablename))

} catch (err) {
  console.error('❌ Erro ao executar migration:', err.message)
  if (err.detail) console.error('   Detalhe:', err.detail)
} finally {
  await client.end()
}
