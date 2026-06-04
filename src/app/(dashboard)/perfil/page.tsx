'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PerfilPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default function PerfilPage() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [showNova, setShowNova] = useState(false)
  const [loadingSenha, setLoadingSenha] = useState(false)
  const router = useRouter()

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }
    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    setLoadingSenha(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) {
      toast.error('Erro ao alterar senha: ' + error.message)
    } else {
      toast.success('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    }
    setLoadingSenha(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie suas informações de acesso</p>
      </div>

      {/* Alterar Senha */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Lock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Alterar Senha</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Escolha uma senha forte com pelo menos 6 caracteres
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAlterarSenha} className="space-y-4">
            <div className="space-y-1">
              <Label>Nova Senha *</Label>
              <div className="relative">
                <Input
                  type={showNova ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNova(!showNova)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  type={showSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmarSenha && novaSenha !== confirmarSenha && (
                <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
              )}
              {confirmarSenha && novaSenha === confirmarSenha && novaSenha.length >= 6 && (
                <p className="text-xs text-green-600 mt-1">✓ Senhas coincidem</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loadingSenha || novaSenha !== confirmarSenha || novaSenha.length < 6}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loadingSenha ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Salvando...</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Salvar Nova Senha</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">💡 Dica de Segurança</p>
        <p>Use uma senha com letras maiúsculas, minúsculas, números e símbolos. Ex: <code className="bg-amber-100 px-1 rounded">Hotel@2024</code></p>
      </div>
    </div>
  )
}
