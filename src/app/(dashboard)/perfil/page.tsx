import { requireProfile } from '@/lib/auth'
import { PerfilClient } from './perfil-client'

export default async function PerfilPage() {
  const profile = await requireProfile()

  return (
    <PerfilClient
      email={profile.email}
      isAdmin={profile.role === 'master' || profile.role === 'admin'}
      hotelId={profile.hotel_id ?? null}
      mpAccessToken={profile.hotel?.mp_access_token ?? ''}
      mpPublicKey={profile.hotel?.mp_public_key ?? ''}
      betaFeatures={profile.hotel?.beta_tester ?? false}
    />
  )
}
