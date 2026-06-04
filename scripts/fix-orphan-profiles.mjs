/**
 * Corrige perfis que foram criados sem hotel_id (bug de RLS na criação de usuários).
 * Exibe a lista e permite associar manualmente.
 */
import pg from 'pg'
const { Client } = pg

const client = new Client({
  host: 'db.uinqxckkgplnucyxdagi.supabase.co',
  port: 5432, database: 'postgres',
  user: 'postgres', password: 'Ipmh61r3159753@',
  ssl: { rejectUnauthorized: false }
})

await client.connect()

// Buscar todos os perfis
const { rows: profiles } = await client.query(`
  SELECT p.id, p.nome, p.email, p.role, p.status, p.hotel_id,
         h.nome as hotel_nome
  FROM public.profiles p
  LEFT JOIN public.hotels h ON h.id = p.hotel_id
  ORDER BY p.created_at
`)

console.log('\n📋 TODOS OS PERFIS:')
profiles.forEach(p => {
  const hotelStr = p.hotel_nome ? `✅ ${p.hotel_nome}` : '❌ SEM HOTEL'
  console.log(`  [${p.role.padEnd(12)}] ${p.nome.padEnd(25)} | ${hotelStr}`)
})

// Detectar perfis sem hotel (exceto master)
const orphans = profiles.filter(p => !p.hotel_id && p.role !== 'master')
if (orphans.length === 0) {
  console.log('\n✅ Nenhum perfil órfão encontrado. Tudo OK!')
} else {
  console.log(`\n⚠️  ${orphans.length} perfil(s) sem hotel_id encontrado(s):`)
  orphans.forEach(p => console.log(`  - ${p.nome} (${p.email}) | role: ${p.role}`))

  // Buscar hotéis disponíveis
  const { rows: hotels } = await client.query(`SELECT id, nome FROM public.hotels ORDER BY nome`)
  console.log('\n🏨 Hotéis disponíveis:')
  hotels.forEach((h, i) => console.log(`  ${i + 1}. ${h.nome} (${h.id})`))

  console.log('\nPara corrigir, rode:')
  orphans.forEach(p => {
    hotels.forEach(h => {
      console.log(`\n  -- Associar "${p.nome}" ao hotel "${h.nome}":`)
      console.log(`  UPDATE public.profiles SET hotel_id = '${h.id}', role = 'recepcionista', status = 'ativo' WHERE id = '${p.id}';`)
    })
  })
}

await client.end()
