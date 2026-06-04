'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Room, RoomStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { SelectDisplay } from '@/components/ui/select-display'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, ROOM_STATUS_LABEL, ROOM_STATUS_COLOR } from '@/lib/utils'
import { Plus, Search, Pencil, BedDouble } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS: RoomStatus[] = ['livre', 'ocupado', 'reservado', 'limpeza', 'manutencao']
const CATEGORY_OPTIONS = ['Standard', 'Superior', 'Luxo', 'Suite', 'Suite Presidencial', 'Chalé', 'Apartamento']

interface RoomsClientProps {
  rooms: Room[]
  hotelId: string
}

const emptyRoom = { numero: '', nome: '', descricao: '', categoria: 'Standard', capacidade: 2, diaria: 0, status: 'livre' as RoomStatus }

export function RoomsClient({ rooms: initialRooms, hotelId }: RoomsClientProps) {
  const [rooms, setRooms] = useState(initialRooms)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [form, setForm] = useState(emptyRoom)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const filtered = useMemo(() => rooms.filter(r => {
    const matchSearch = !search || r.numero.includes(search) || r.nome?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    return matchSearch && matchStatus
  }), [rooms, search, filterStatus])

  function openNew() {
    setEditing(null)
    setForm(emptyRoom)
    setOpen(true)
  }

  function openEdit(room: Room) {
    setEditing(room)
    setForm({ numero: room.numero, nome: room.nome ?? '', descricao: room.descricao ?? '', categoria: room.categoria, capacidade: room.capacidade, diaria: room.diaria, status: room.status })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.numero || !form.diaria) {
      toast.error('Preencha número e valor da diária')
      return
    }
    setSaving(true)
    const supabase = createClient()
    if (editing) {
      const { error } = await supabase.from('rooms').update(form).eq('id', editing.id)
      if (error) { toast.error('Erro ao atualizar quarto'); setSaving(false); return }
      setRooms(rooms.map(r => r.id === editing.id ? { ...r, ...form } : r))
      toast.success('Quarto atualizado')
    } else {
      const { data, error } = await supabase.from('rooms').insert({ ...form, hotel_id: hotelId }).select().single()
      if (error) { toast.error('Erro ao criar quarto'); setSaving(false); return }
      setRooms([...rooms, data])
      toast.success('Quarto criado')
    }
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  const countByStatus = (s: string) => rooms.filter(r => r.status === s).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quartos</h1>
          <p className="text-slate-500 text-sm mt-1">{rooms.length} quarto(s) cadastrado(s)</p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Quarto
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={`p-3 rounded-xl border text-left transition-all ${filterStatus === s ? ROOM_STATUS_COLOR[s] + ' border-current' : 'bg-white border-slate-200 hover:border-slate-300'}`}
          >
            <p className="text-2xl font-bold">{countByStatus(s)}</p>
            <p className="text-xs mt-0.5">{ROOM_STATUS_LABEL[s]}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por número ou nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BedDouble className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum quarto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(room => (
            <Card key={room.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(room)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{room.numero}</p>
                    <p className="text-sm text-slate-500">{room.nome ?? room.categoria}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${ROOM_STATUS_COLOR[room.status]}`}>
                    {ROOM_STATUS_LABEL[room.status]}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  <p>Categoria: {room.categoria}</p>
                  <p>Capacidade: {room.capacidade} pessoa(s)</p>
                  <p className="text-base font-semibold text-slate-900 mt-2">{formatCurrency(room.diaria)}<span className="text-xs font-normal text-slate-500">/noite</span></p>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full text-xs" onClick={e => { e.stopPropagation(); openEdit(room) }}>
                  <Pencil className="h-3 w-3 mr-1" /> Editar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Quarto' : 'Novo Quarto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Número *</Label>
                <Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="101" />
              </div>
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Opcional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v ?? 'Standard' })}>
                  <SelectTrigger><SelectDisplay value={form.categoria} options={CATEGORY_OPTIONS.map(c => ({ value: c, label: c }))} placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>{CATEGORY_OPTIONS.map((c, i) => <SelectItem key={i} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Capacidade</Label>
                <Input type="number" min={1} value={form.capacidade} onChange={e => setForm({ ...form, capacidade: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Diária (R$) *</Label>
                <Input type="number" min={0} step="0.01" value={form.diaria} onChange={e => setForm({ ...form, diaria: +e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as RoomStatus })}>
                  <SelectTrigger><SelectDisplay value={form.status} options={STATUS_OPTIONS.map(s => ({ value: s, label: ROOM_STATUS_LABEL[s] }))} /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{ROOM_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição opcional..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
