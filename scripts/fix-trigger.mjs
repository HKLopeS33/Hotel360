import pg from 'pg'
const { Client } = pg

const client = new Client({
  host: 'db.uinqxckkgplnucyxdagi.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Ipmh61r3159753@',
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log('✅ Conectado')

// Recriar a função com schema explícito e search_path correto
await client.query(`
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    INSERT INTO public.profiles (id, nome, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'recepcionista')
    );
    RETURN NEW;
  END;
  $$;
`)
console.log('✅ Trigger function corrigida (schema public explícito)')

// Recriar o trigger para garantir que aponta para a função correta
await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`)
await client.query(`
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()
`)
console.log('✅ Trigger recriado')

// Verificar
const { rows } = await client.query(`
  SELECT tgname, tgenabled, tgfoid::regproc AS function
  FROM pg_trigger
  WHERE tgname = 'on_auth_user_created'
`)
console.log('Trigger:', rows[0])

await client.end()
console.log('\nAgora tente criar o usuário master novamente.')
