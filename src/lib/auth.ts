import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Profile } from '@/types/database'

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  // O proxy já validou o usuário e repassou o id via header — evita uma
  // segunda chamada de rede a getUser() em toda navegação autenticada.
  const headersList = await headers()
  let userId = headersList.get('x-user-id')

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    userId = user.id
  }

  const { data } = await supabase
    .from('profiles')
    .select('*, hotel:hotels(*)')
    .eq('id', userId)
    .single()

  return data as Profile | null
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireProfile() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return profile
}

export async function requireMaster() {
  const profile = await requireProfile()
  if (profile.role !== 'master') redirect('/dashboard')
  return profile
}
