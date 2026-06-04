'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole, UserStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { SelectDisplay } from '@/components/ui/select-display'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Plus, Eye, EyeOff, Copy, Check, Pencil, KeyRound, RefreshCw } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type HotelMin = { id: string; nome: string; plano_id: string; status: string; data_vencimento: string; created_at: string }
type ProfileWithHotel = Omit<Profile, 'hotel'> & { hotel?: HotelMin | null }

const ROLE_LABEL: Record<UserRole, string> = {
  master: 'Master',
  admin: 'Administrador',
  recepcionista: 'Recepcionista',
  camareira: 'Camareira',
  manutencao: 'Manutenção',
}

const STATUS_COLOR: Record<UserStatus, string> = {
  ativo: 'text-green-600 bg-green-50 border-green-200',
  inativo: 'text-red-600 bg-red-50 border-red-200',
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'camareira', label: 'Camareira' },
  { value: 'manutencao', label: 'Manutenção' },
]

const emptyForm = {
  nome: '', email: '', senha: '', hotel_id: '', role: 'recepcionista' as UserRole, status: 'ativo' as UserStatus
}

interface UsersAdminClientProps {
  users: ProfileWithHotel[]
  hotels: { id: string; nome: string }[]
  currentProfile: Profile
}

export function UsersAdminClient({ users: initialUsers, hotels, currentProfile }: UsersAdminClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<ProfileWithHotel | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState({ role: 'recepcionista' as UserRole, status: 'ativo' as UserStatus, hotel_id: '' })
  const [showSenha, setShowSenha] = useState(false)
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingSenha, setSavingSenha] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newUserResult, setNewUserResult] = useState<{ email: string; senha: string } | null>(null)
  const [novaSenhaEdit, setNovaSenhaEdit] = useState('')
  const [senhaCopied, setSenhaCopied] = useState(false)
  const router = useRouter()

  function gerarSenha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#!'
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  function openNew() {
    setNewUserResult(null)
    setForm({ ...emptyForm, senha: gerarSenha(), hotel_id: currentProfile.role === 'admin' ? currentProfile.hotel_id ?? '' : '' })
    setOpen(true)
  }

  function openEdit(user: ProfileWithHotel) {
    setEditing(user)
    setEditForm({ role: user.role, status: user.status, hotel_id: user.hotel_id ?? '' })
    setNovaSenhaEdit('')
    setShowNovaSenha(false)
    setSenhaCopied(false)
    setEditOpen(true)
  }

  async function handleRedefinirSenha() {
    if (!editing || !novaSenhaEdit || novaSenhaEdit.length < 6) {
      toast.error('Digite uma senha com pelo menos 6 caracteres')
      return
    }
    setSavingSenha(true)
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: editing.id, novaSenha: novaSenhaEdit }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Erro ao redefinir senha')
    } else {
      toast.success(`Senha de ${editing.nome} redefinida com sucesso!`)
      // Mostra a senha nova para copiar
      setNewUserResult({ email: editing.email, senha: novaSenhaEdit })
      setNovaSenhaEdit('')
    }
    setSavingSenha(false)
  }

  function copiarSenhaEdit() {
    if (!newUserResult) return
    navigator.clipboard.writeText(`E-mail: ${newUserResult.email}\nSenha: ${newUserResult.senha}`)
    setSenhaCopied(true)
    setTimeout(() => setSenhaCopied(false), 2000)
    toast.success('Credenciais copiadas!')
  }

  async function handleCriarUsuario() {
    if (!form.nome || !form.email || !form.senha) {
      toast.error('Nome, e-mail e senha são obrigatórios')
      return
    }
    if (currentProfile.role === 'master' && !form.hotel_id && form.role !== 'master') {
      toast.error('Selecione o hotel para este usuário')
      return
    }
    setSaving(true)

    // Usar API route para criar usuário (precisa de service role key no servidor)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        hotel_id: form.hotel_id || null,
        role: form.role,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Erro ao criar usuário')
      setSaving(false)
      return
    }

    toast.success(`Usuário ${form.nome} criado com sucesso!`)
    setNewUserResult({ email: form.email, senha: form.senha })

    // Atualiza a lista local
    const hotelObj = hotels.find(h => h.id === form.hotel_id)
    const novoUser: ProfileWithHotel = {
      id: data.id,
      nome: form.nome,
      email: form.email,
      role: form.role,
      status: form.status,
      hotel_id: form.hotel_id || undefined,
      created_at: new Date().toISOString(),
      hotel: hotelObj ? { id: hotelObj.id, nome: hotelObj.nome, plano_id: '', status: 'ativo', data_vencimento: '', created_at: '' } : undefined,
    }
    setUsers(prev => [novoUser, ...prev])
    setSaving(false)
    router.refresh()
  }

  async function handleEditarUsuario() {
    if (!editing) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ role: editForm.role, status: editForm.status, hotel_id: editForm.hotel_id || null })
      .eq('id', editing.id)

    if (error) {
      toast.error('Erro ao atualizar usuário')
      setSaving(false)
      return
    }
    const hotelObj = hotels.find(h => h.id === editForm.hotel_id)
    setUsers(users.map(u => u.id === editing.id
      ? { ...u, role: editForm.role, status: editForm.status, hotel_id: editForm.hotel_id || undefined, hotel: hotelObj ? { id: hotelObj.id, nome: hotelObj.nome, plano_id: '', status: 'ativo', data_vencimento: '', created_at: '' } : undefined }
      : u
    ))
    toast.success('Usuário atualizado')
    setEditOpen(false)
    setSaving(false)
    router.refresh()
  }

  function copiarCredenciais() {
    if (!newUserResult) return
    navigator.clipboard.writeText(`E-mail: ${newUserResult.email}\nSenha: ${newUserResult.senha}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Credenciais copiadas!')
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Usuário</TableHead>
                <TableHead>Hotel</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => {
                const initials = u.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <TableRow key={u.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{u.nome}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {u.hotel?.nome ?? <span className="text-slate-400 italic text-xs">Global (Master)</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{ROLE_LABEL[u.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLOR[u.status]}`}>
                        {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.id !== currentProfile.id && (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog: Criar Usuário */}
      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setNewUserResult(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>

          {newUserResult ? (
            /* Tela de sucesso com credenciais */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-semibold text-lg mb-1">✅ Usuário Criado!</p>
                <p className="text-green-600 text-sm">Guarde ou compartilhe as credenciais de acesso:</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="font-semibold text-slate-900">{newUserResult.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Senha:</span>
                  <span className="font-semibold text-slate-900">{newUserResult.senha}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={copiarCredenciais} variant="outline" className="flex-1">
                  {copied ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copiado!' : 'Copiar Credenciais'}
                </Button>
                <Button onClick={() => { setNewUserResult(null); setForm({ ...emptyForm, senha: gerarSenha() }) }} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Criar Outro
                </Button>
              </div>
            </div>
          ) : (
            /* Formulário de criação */
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={f('nome')} placeholder="João da Silva" />
              </div>
              <div className="space-y-1">
                <Label>E-mail *</Label>
                <Input type="email" value={form.email} onChange={f('email')} placeholder="joao@hotel.com" />
              </div>
              <div className="space-y-1">
                <Label>Senha de acesso *</Label>
                <div className="relative">
                  <Input
                    type={showSenha ? 'text' : 'password'}
                    value={form.senha}
                    onChange={f('senha')}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-20"
                  />
                  <div className="absolute right-1 top-1 flex gap-1">
                    <button type="button" onClick={() => setShowSenha(!showSenha)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                      {showSenha ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, senha: gerarSenha() })} className="p-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium">
                      Gerar
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Use o botão "Gerar" para criar uma senha segura automaticamente</p>
              </div>

              {currentProfile.role === 'master' && (
                <div className="space-y-1">
                  <Label>Hotel</Label>
                  <Select value={form.hotel_id} onValueChange={v => setForm({ ...form, hotel_id: v ?? '' })}>
                    <SelectTrigger><SelectDisplay value={form.hotel_id} options={[{ value: '', label: 'Nenhum (apenas Master)' }, ...hotels.map(h => ({ value: h.id!, label: h.nome }))]} placeholder="Selecionar hotel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum (apenas Master)</SelectItem>
                      {hotels.map(h => <SelectItem key={h.id!} value={h.id!}>{h.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label>Função</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger><SelectDisplay value={form.role} options={(currentProfile.role === 'master' ? [{ value: 'master', label: 'Master' }, ...ROLE_OPTIONS] : ROLE_OPTIONS).map(r => ({ value: r.value, label: r.label }))} /></SelectTrigger>
                  <SelectContent>
                    {(currentProfile.role === 'master' ? [{ value: 'master' as UserRole, label: 'Master' }, ...ROLE_OPTIONS] : ROLE_OPTIONS)
                      .map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                <p className="font-medium mb-1">📋 Como funciona:</p>
                <p>O usuário recebe o e-mail e senha para acessar o sistema. Você deve enviar as credenciais manualmente após a criação.</p>
              </div>
            </div>
          )}

          {!newUserResult && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCriarUsuario} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Usuário */}
      <Dialog open={editOpen} onOpenChange={o => { setEditOpen(o); if (!o) { setNewUserResult(null); setNovaSenhaEdit('') } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Cabeçalho do usuário */}
            {editing && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {editing.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{editing.nome}</p>
                  <p className="text-xs text-slate-500">{editing.email}</p>
                </div>
              </div>
            )}

            {/* Seção: Permissões */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Permissões</p>

              {currentProfile.role === 'master' && (
                <div className="space-y-1">
                  <Label>Hotel</Label>
                  <Select value={editForm.hotel_id} onValueChange={v => setEditForm({ ...editForm, hotel_id: v ?? '' })}>
                    <SelectTrigger><SelectDisplay value={editForm.hotel_id} options={[{ value: '', label: 'Nenhum (Master)' }, ...hotels.map(h => ({ value: h.id!, label: h.nome }))]} placeholder="Selecionar hotel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum (Master)</SelectItem>
                      {hotels.map(h => <SelectItem key={h.id!} value={h.id!}>{h.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label>Função</Label>
                <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v as UserRole })}>
                  <SelectTrigger><SelectDisplay value={editForm.role} options={(currentProfile.role === 'master' ? [{ value: 'master', label: 'Master' }, ...ROLE_OPTIONS] : ROLE_OPTIONS).map(r => ({ value: r.value, label: r.label }))} /></SelectTrigger>
                  <SelectContent>
                    {(currentProfile.role === 'master' ? [{ value: 'master' as UserRole, label: 'Master' }, ...ROLE_OPTIONS] : ROLE_OPTIONS)
                      .map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v as UserStatus })}>
                  <SelectTrigger><SelectDisplay value={editForm.status} options={[{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }]} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Seção: Redefinir Senha */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Redefinir Senha</p>
              </div>

              {newUserResult && newUserResult.email === editing?.email ? (
                /* Senha redefinida — exibe para copiar */
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 text-sm font-medium mb-2">✅ Senha redefinida com sucesso!</p>
                    <div className="bg-white border border-green-200 rounded-lg p-2.5 font-mono text-sm space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 text-xs">E-mail:</span>
                        <span className="text-slate-900 font-semibold truncate">{newUserResult.email}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 text-xs">Nova Senha:</span>
                        <span className="text-slate-900 font-semibold">{newUserResult.senha}</span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={copiarSenhaEdit} variant="outline" className="w-full">
                    {senhaCopied ? <><Check className="h-4 w-4 mr-2 text-green-600" /> Copiado!</> : <><Copy className="h-4 w-4 mr-2" /> Copiar Credenciais</>}
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500" onClick={() => setNewUserResult(null)}>
                    Redefinir outra vez
                  </Button>
                </div>
              ) : (
                /* Formulário de nova senha */
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showNovaSenha ? 'text' : 'password'}
                      value={novaSenhaEdit}
                      onChange={e => setNovaSenhaEdit(e.target.value)}
                      placeholder="Nova senha (mín. 6 caracteres)"
                      className="pr-20"
                    />
                    <div className="absolute right-1 top-1 flex gap-1">
                      <button type="button" onClick={() => setShowNovaSenha(!showNovaSenha)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                        {showNovaSenha ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button type="button" onClick={() => setNovaSenhaEdit(gerarSenha())} className="p-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium" title="Gerar senha automática">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={handleRedefinirSenha}
                    disabled={savingSenha || novaSenhaEdit.length < 6}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    {savingSenha
                      ? 'Redefinindo...'
                      : <><KeyRound className="h-4 w-4 mr-2" /> Redefinir Senha</>
                    }
                  </Button>
                  <p className="text-xs text-slate-400 text-center">
                    Clique em <RefreshCw className="h-3 w-3 inline" /> para gerar uma senha segura automaticamente
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Fechar</Button>
            <Button onClick={handleEditarUsuario} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Salvando...' : 'Salvar Permissões'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
