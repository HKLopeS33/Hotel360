import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Profile } from '@/types/database'

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*, hotel:hotels(*)')
    .eq('id', user.id)
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
