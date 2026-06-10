'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Credenciais inválidas. Verifique e-mail e senha.')
      setLoading(false)
      return
    }

    // Buscar o role do usuário para redirecionar corretamente
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const DEFAULT_ROUTE: Record<string, string> = {
      master:        '/dashboard',
      admin:         '/dashboard',
      recepcionista: '/quartos',
      camareira:     '/limpeza',
      manutencao:    '/manutencao',
    }

    const role = (profile?.role as string) ?? 'recepcionista'
    router.push(DEFAULT_ROUTE[role] ?? '/quartos')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      {/* Wallpaper de fundo */}
      <Image
        src="/wallpapers/desktop-1920x1080.jpg"
        alt=""
        fill
        priority
        className="object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-blue-900/40" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-8">
          <div className="relative h-16 w-56 bg-white rounded-xl px-4 py-2 shadow-lg">
            <Image src="/logo.png" alt="Hotel360" fill className="object-contain p-1" priority />
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Entrar na plataforma</CardTitle>
            <CardDescription className="text-slate-400">
              Informe suas credenciais de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          © 2024 Hotel360. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
