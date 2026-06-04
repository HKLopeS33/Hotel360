'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Hotel, Plan, HotelStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { SelectDisplay } from '@/components/ui/select-display'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Plus, Building2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type HotelWithPlan = Hotel & { plan?: Plan }

const STATUS_COLOR: Record<HotelStatus, string> = {
  ativo: 'text-green-600 bg-green-50 border-green-200',
  suspenso: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  bloqueado: 'text-red-600 bg-red-50 border-red-200',
}

const STATUS_LABEL: Record<HotelStatus, string> = { ativo: 'Ativo', suspenso: 'Suspenso', bloqueado: 'Bloqueado' }

const emptyForm = { nome: '', cnpj: '', telefone: '', email: '', endereco: '', cidade: '', estado: '', plano_id: '', status: 'ativo' as HotelStatus, data_vencimento: '' }

interface HotelsAdminClientProps {
  hotels: HotelWithPlan[]
  plans: Plan[]
}

export function HotelsAdminClient({ hotels: initialHotels, plans }: HotelsAdminClientProps) {
  const [hotels, setHotels] = useState(initialHotels)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<HotelWithPlan | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function openNew() {
    setEditing(null)
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1)
    setForm({ ...emptyForm, plano_id: plans[0]?.id ?? '', data_vencimento: nextMonth.toISOString().split('T')[0] })
    setOpen(true)
  }

  function openEdit(hotel: HotelWithPlan) {
    setEditing(hotel)
    setForm({ nome: hotel.nome, cnpj: hotel.cnpj ?? '', telefone: hotel.telefone ?? '', email: hotel.email ?? '', endereco: hotel.endereco ?? '', cidade: hotel.cidade ?? '', estado: hotel.estado ?? '', plano_id: hotel.plano_id, status: hotel.status, data_vencimento: hotel.data_vencimento })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.nome || !form.plano_id) { toast.error('Nome e plano são obrigatórios'); return }
    setSaving(true)
    const payload = { nome: form.nome, cnpj: form.cnpj || null, telefone: form.telefone || null, email: form.email || null, endereco: form.endereco || null, cidade: form.cidade || null, estado: form.estado || null, plano_id: form.plano_id, status: form.status, data_vencimento: form.data_vencimento }
    if (editing) {
      const { error } = await supabase.from('hotels').update(payload).eq('id', editing.id)
      if (error) { toast.error('Erro ao atualizar hotel'); setSaving(false); return }
      const plan = plans.find(p => p.id === form.plano_id)
      setHotels(hotels.map(h => h.id === editing.id ? { ...h, ...payload, plan } : h))
      toast.success('Hotel atualizado')
    } else {
      const { data, error } = await supabase.from('hotels').insert(payload).select('*, plan:plans(*)').single()
      if (error) { toast.error('Erro ao criar hotel'); setSaving(false); return }
      setHotels([data, ...hotels])
      toast.success('Hotel criado com sucesso')
    }
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotéis</h1>
          <p className="text-slate-500 text-sm mt-1">{hotels.length} hotel(is) cadastrado(s)</p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Hotel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['ativo', 'suspenso', 'bloqueado'] as HotelStatus[]).map(s => (
          <Card key={s} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{hotels.filter(h => h.status === s).length}</p>
              <p className="text-sm text-slate-500">{STATUS_LABEL[s]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {hotels.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum hotel cadastrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Hotel</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotels.map(h => (
                <TableRow key={h.id} className="hover:bg-slate-50">
                  <TableCell>
                    <p className="font-medium">{h.nome}</p>
                    <p className="text-xs text-slate-500">{h.email ?? h.telefone ?? '—'}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{h.plan?.nome ?? '—'}</p>
                    <p className="text-xs text-slate-500">{h.plan ? formatCurrency(h.plan.valor) + '/mês' : ''}</p>
                  </TableCell>
                  <TableCell className={new Date(h.data_vencimento) < new Date() ? 'text-red-600 font-medium' : 'text-slate-600'}>
                    {formatDate(h.data_vencimento)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${STATUS_COLOR[h.status]}`}>{STATUS_LABEL[h.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(h)}><Pencil className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Hotel' : 'Novo Hotel'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Nome *</Label><Input value={form.nome} onChange={f('nome')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>CNPJ</Label><Input value={form.cnpj} onChange={f('cnpj')} /></div>
              <div className="space-y-1"><Label>Telefone</Label><Input value={form.telefone} onChange={f('telefone')} /></div>
            </div>
            <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.email} onChange={f('email')} /></div>
            <div className="space-y-1"><Label>Endereço</Label><Input value={form.endereco} onChange={f('endereco')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Cidade</Label><Input value={form.cidade} onChange={f('cidade')} /></div>
              <div className="space-y-1"><Label>Estado</Label><Input value={form.estado} onChange={f('estado')} maxLength={2} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Plano *</Label>
                <Select value={form.plano_id} onValueChange={v => setForm({ ...form, plano_id: v ?? '' })}>
                  <SelectTrigger>
                    <SelectDisplay
                      value={form.plano_id}
                      options={plans.map(p => ({ value: p.id!, label: `${p.nome} • ${formatCurrency(p.valor)}/mês` }))}
                      placeholder="Selecione o plano"
                    />
                  </SelectTrigger>
                  <SelectContent>{plans.map(p => <SelectItem key={p.id!} value={p.id!}>{p.nome} • {formatCurrency(p.valor)}/mês</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as HotelStatus })}>
                  <SelectTrigger>
                    <SelectDisplay
                      value={form.status}
                      options={Object.entries(STATUS_LABEL).map(([k, v]) => ({ value: k, label: v }))}
                      placeholder="Selecione o status"
                    />
                  </SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Data de Vencimento</Label><Input type="date" value={form.data_vencimento} onChange={f('data_vencimento')} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
