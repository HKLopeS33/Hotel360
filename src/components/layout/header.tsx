'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Bell, Hotel } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const ROLE_LABEL: Record<string, string> = {
  master: 'Master',
  admin: 'Administrador',
  recepcionista: 'Recepcionista',
  camareira: 'Camareira',
  manutencao: 'Manutenção',
}

interface HeaderProps {
  profile: Profile
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    toast.success('Logout realizado com sucesso')
  }

  const initials = profile.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-2 md:hidden">
        <div className="p-1.5 bg-blue-600 rounded-lg">
          <Hotel className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-sm">Hotel360</span>
      </div>

      <div className="hidden md:block">
        {profile.hotel && (
          <p className="text-sm text-slate-500">{profile.hotel.nome}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100 transition-colors outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">{profile.nome}</p>
              <p className="text-xs text-slate-500 mt-0.5">{ROLE_LABEL[profile.role] ?? profile.role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {/* Cabeçalho com info do usuário — não usa GroupLabel pois exige Menu.Group */}
            <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
              <p className="text-sm font-medium text-slate-900">{profile.nome}</p>
              <p className="text-xs text-slate-500">{profile.email}</p>
            </div>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuItem>
                <Link href="/perfil" className="flex items-center w-full">
                  <User className="h-4 w-4 mr-2" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
