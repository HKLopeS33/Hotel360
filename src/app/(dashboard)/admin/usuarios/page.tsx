import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { UsersAdminClient } from './users-admin-client'
import { redirect } from 'next/navigation'

export default async function UsuariosAdminPage() {
  const profile = await requireProfile()
  if (profile.role !== 'master' && profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const query = supabase.from('profiles').select('*, hotel:hotels(id,nome)').order('nome')
  if (profile.role === 'admin') query.eq('hotel_id', profile.hotel_id!)

  const [{ data: users }, { data: hotels }] = await Promise.all([
    query,
    profile.role === 'master'
      ? supabase.from('hotels').select('id,nome').order('nome')
      : Promise.resolve({ data: [profile.hotel] }),
  ])

  return <UsersAdminClient users={users ?? []} hotels={(hotels ?? []) as { id: string; nome: string }[]} currentProfile={profile} />
}
