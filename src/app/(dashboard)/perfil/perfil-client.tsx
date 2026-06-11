'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Lock, Save, Eye, EyeOff, CreditCard, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { AppUpdateCard } from '@/components/app-update-card'

interface PerfilClientProps {
  email: string
  isAdmin: boolean
  hotelId: string | null
  mpAccessToken: string
  mpPublicKey: string
  betaFeatures: boolean
}

export function PerfilClient({ email, isAdmin, hotelId, mpAccessToken, mpPublicKey, betaFeatures }: PerfilClientProps) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [showNova, setShowNova] = useState(false)
  const [loadingSenha, setLoadingSenha] = useState(false)

  const [novoEmail, setNovoEmail] = useState(email)
  const [loadingEmail, setLoadingEmail] = useState(false)

  const [mpForm, setMpForm] = useState({
    mp_access_token: mpAccessToken,
    mp_public_key: mpPublicKey,
  })
  const [loadingMp, setLoadingMp] = useState(false)

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

  async function handleAlterarEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!novoEmail || novoEmail === email) {
      toast.error('Informe um e-mail diferente do atual')
      return
    }
    setLoadingEmail(true)
    try {
      const res = await fetch('/api/admin/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: novoEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao alterar e-mail')
      } else {
        toast.success('E-mail alterado com sucesso!')
      }
    } catch {
      toast.error('Erro ao alterar e-mail')
    }
    setLoadingEmail(false)
  }

  async function handleSalvarMp() {
    setLoadingMp(true)
    const supabase = createClient()
    const { error } = await supabase.from('hotels').update({
      mp_access_token: mpForm.mp_access_token || null,
      mp_public_key: mpForm.mp_public_key || null,
    }).eq('id', hotelId)

    if (error) {
      toast.error('Erro ao salvar credenciais: ' + error.message)
    } else {
      toast.success('Credenciais salvas')
    }
    setLoadingMp(false)
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

      {/* Alterar E-mail (somente admin/master) */}
      {isAdmin && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Alterar E-mail</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Atualize o e-mail usado para acessar o sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAlterarEmail} className="space-y-4">
              <div className="space-y-1">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={novoEmail}
                  onChange={e => setNovoEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loadingEmail} className="bg-blue-600 hover:bg-blue-700">
                {loadingEmail ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Salvando...</span>
                ) : (
                  <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Salvar E-mail</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Credenciais Mercado Pago (somente admin/master, beta) */}
      {isAdmin && betaFeatures && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Mercado Pago</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Credenciais usadas para receber pagamentos das reservas online
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Access Token</Label>
              <Input
                type="password"
                placeholder="APP_USR-..."
                value={mpForm.mp_access_token}
                onChange={e => setMpForm(f => ({ ...f, mp_access_token: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Public Key</Label>
              <Input
                placeholder="APP_USR-..."
                value={mpForm.mp_public_key}
                onChange={e => setMpForm(f => ({ ...f, mp_public_key: e.target.value }))}
              />
            </div>
            <Button onClick={handleSalvarMp} disabled={loadingMp} className="bg-blue-600 hover:bg-blue-700">
              {loadingMp ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Salvando...</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Salvar Credenciais</span>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">💡 Dica de Segurança</p>
        <p>Use uma senha com letras maiúsculas, minúsculas, números e símbolos. Ex: <code className="bg-amber-100 px-1 rounded">Hotel@2024</code></p>
      </div>

      {/* Versão do app desktop e atualizações automáticas (somente no Electron) */}
      <AppUpdateCard />
    </div>
  )
}
