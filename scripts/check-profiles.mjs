import pg from 'pg'
const { Client } = pg

const client = new Client({
  host: 'db.uinqxckkgplnucyxdagi.supabase.co',
  port: 5432, database: 'postgres',
  user: 'postgres', password: 'Ipmh61r3159753@',
  ssl: { rejectUnauthorized: false }
})

await client.connect()

const { rows } = await client.query(`
  SELECT p.id, p.nome, p.email, p.role, p.status, p.hotel_id, h.nome as hotel_nome
  FROM public.profiles p
  LEFT JOIN public.hotels h ON h.id = p.hotel_id
  ORDER BY p.created_at
`)

console.log('\n📋 PERFIS CADASTRADOS:')
rows.forEach(r => {
  console.log(`  ${r.nome} | ${r.role} | hotel: ${r.hotel_nome ?? 'NENHUM'} | hotel_id: ${r.hotel_id ?? 'NULL'}`)
})

// Verificar se há algum erro de RLS na tabela guests
const { rows: guestRows } = await client.query(`SELECT count(*) FROM public.guests`)
console.log(`\n🏨 Total de hóspedes no banco: ${guestRows[0].count}`)

await client.end()
