'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Profile } from '@/types/database'
import {
  LayoutDashboard, BedDouble, Users, CalendarDays,
  LogIn, LogOut, Sparkles, Wrench, DollarSign, Building2,
  ShieldCheck, ChevronLeft, ChevronRight, Globe,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  profile: Profile
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  /** Roles que podem ver este item. Vazio = todos os roles de hotel */
  roles: string[]
  /** Se true, item só aparece para hotéis com beta_tester = true */
  betaOnly?: boolean
}

// Acesso por função:
// master / admin  → tudo
// recepcionista   → quartos, hóspedes, reservas, check-in, check-out
// camareira       → limpeza
// manutencao      → manutenção
const ALL = ['master', 'admin', 'recepcionista', 'camareira', 'manutencao']
const MANAGEMENT = ['master', 'admin']
const RECEPTION = ['master', 'admin', 'recepcionista']

const navItems: NavItem[] = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, roles: MANAGEMENT },
  { href: '/quartos',    label: 'Quartos',    icon: BedDouble,       roles: RECEPTION },
  { href: '/hospedes',   label: 'Hóspedes',   icon: Users,           roles: RECEPTION },
  { href: '/reservas',   label: 'Reservas',   icon: CalendarDays,    roles: RECEPTION },
  { href: '/reservas-online', label: 'Reservas Online', icon: Globe, roles: RECEPTION, betaOnly: true },
  { href: '/checkin',    label: 'Check-in',   icon: LogIn,           roles: RECEPTION },
  { href: '/checkout',   label: 'Check-out',  icon: LogOut,          roles: RECEPTION },
  { href: '/limpeza',    label: 'Limpeza',    icon: Sparkles,        roles: ['master', 'admin', 'camareira'] },
  { href: '/manutencao', label: 'Manutenção', icon: Wrench,          roles: ['master', 'admin', 'manutencao'] },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign,      roles: MANAGEMENT },
]

const adminItems: NavItem[] = [
  { href: '/admin/hoteis',   label: 'Hotéis',   icon: Building2,  roles: ['master'] },
  { href: '/admin/usuarios', label: 'Usuários', icon: ShieldCheck, roles: MANAGEMENT },
]

// Rota padrão após login por role
export const DEFAULT_ROUTE: Record<string, string> = {
  master:        '/dashboard',
  admin:         '/dashboard',
  recepcionista: '/quartos',
  camareira:     '/limpeza',
  manutencao:    '/manutencao',
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))

  const betaFeatures = profile.hotel?.beta_tester ?? false

  const visibleNav   = navItems.filter(i => i.roles.includes(profile.role) && (!i.betaOnly || betaFeatures))
  const visibleAdmin = adminItems.filter(i => i.roles.includes(profile.role))

  return (
    <aside className={cn(
      'hidden md:flex flex-col bg-slate-900 text-white transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b border-slate-700',
        collapsed && 'justify-center'
      )}>
        <div className="rounded-lg shrink-0 overflow-hidden h-8 w-8 relative">
          <Image src="/icons/icon-64.png" alt="Hotel360" fill sizes="32px" className="object-contain" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm truncate">Hotel360</p>
            <p className="text-xs text-slate-400 truncate">
              {profile.hotel?.nome ?? 'Administrador'}
            </p>
          </div>
        )}
      </div>

      {/* Nav principal */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive(href)
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {/* Seção de Administração */}
        {visibleAdmin.length > 0 && (
          <>
            {!collapsed && (
              <p className="text-xs text-slate-500 px-3 pt-4 pb-1 uppercase tracking-wider">
                Administração
              </p>
            )}
            {visibleAdmin.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive(href)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Badge do plano */}
      {!collapsed && profile.hotel?.plan && (
        <div className="px-4 py-3 border-t border-slate-700">
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-400 text-xs w-full justify-center"
          >
            Plano {profile.hotel.plan.nome}
          </Badge>
        </div>
      )}

      {/* Colapsar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}
