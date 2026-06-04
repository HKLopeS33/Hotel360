import { redirect } from 'next/navigation'
import { Profile } from '@/types/database'

// Roles que podem acessar cada recurso
export const ACCESS = {
  dashboard:  ['master', 'admin'],
  financeiro: ['master', 'admin'],
  limpeza:    ['master', 'admin', 'camareira'],
  manutencao: ['master', 'admin', 'manutencao'],
  quartos:    ['master', 'admin', 'recepcionista'],
  hospedes:   ['master', 'admin', 'recepcionista'],
  reservas:   ['master', 'admin', 'recepcionista'],
  checkin:    ['master', 'admin', 'recepcionista'],
  checkout:   ['master', 'admin', 'recepcionista'],
  admin:      ['master', 'admin'],
} as const

export type AccessKey = keyof typeof ACCESS

/** Rota padrão por função */
const DEFAULT_ROUTE: Record<string, string> = {
  master:        '/dashboard',
  admin:         '/dashboard',
  recepcionista: '/quartos',
  camareira:     '/limpeza',
  manutencao:    '/manutencao',
}

/**
 * Verifica se o perfil tem acesso ao recurso.
 * Se não tiver, redireciona para a rota padrão do seu role.
 */
export function requireAccess(profile: Profile, resource: AccessKey) {
  const allowed = ACCESS[resource] as readonly string[]
  if (!allowed.includes(profile.role)) {
    redirect(DEFAULT_ROUTE[profile.role] ?? '/quartos')
  }
}
