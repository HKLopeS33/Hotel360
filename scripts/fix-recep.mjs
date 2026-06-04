import pg from 'pg'
const { Client } = pg

const client = new Client({
  host: 'db.uinqxckkgplnucyxdagi.supabase.co',
  port: 5432, database: 'postgres',
  user: 'postgres', password: 'Ipmh61r3159753@',
  ssl: { rejectUnauthorized: false }
})

await client.connect()

// Corrigir "Recepção" para o Oxente Hotel
await client.query(`
  UPDATE public.profiles
  SET hotel_id = 'd062f43c-28b2-474b-93d8-d53eaf64e702',
      role = 'recepcionista',
      status = 'ativo'
  WHERE id = 'b456d7dd-c243-4420-9b88-5676f2f3056d'
`)

console.log('✅ Perfil "Recepção" corrigido → Oxente Hotel | Recepcionista')

// Verificar
const { rows } = await client.query(`
  SELECT p.nome, p.email, p.role, p.status, h.nome as hotel_nome
  FROM public.profiles p
  LEFT JOIN public.hotels h ON h.id = p.hotel_id
  WHERE p.id = 'b456d7dd-c243-4420-9b88-5676f2f3056d'
`)
console.log('Perfil atualizado:', rows[0])

await client.end()
