'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Reservation, ReservationStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { SelectDisplay } from '@/components/ui/select-display'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, RESERVATION_STATUS_LABEL, RESERVATION_STATUS_COLOR, diffDays } from '@/lib/utils'

function formatTime(time: string | null | undefined): string {
  if (!time) return ''
  return time.slice(0, 5) // "HH:MM"
}
import { Plus, Search, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type ReservationWithRelations = Reservation & {
  room?: { id: string; numero: string; nome?: string; diaria: number }
  guest?: { id: string; nome: string; cpf?: string; telefone?: string }
}

type RoomOption = { id: string; numero: string; nome?: string; diaria: number; status: string }
type GuestOption = { id: string; nome: string; cpf?: string; telefone?: string }

const STATUS_FLOW: Record<ReservationStatus, ReservationStatus[]> = {
  criada: ['confirmada', 'cancelada'],
  confirmada: ['checkin', 'cancelada'],
  checkin: ['hospedado'],
  hospedado: ['checkout'],
  checkout: [],
  cancelada: [],
}

// ─── Dialog isolado com estado próprio ───────────────────────────────────────
const emptyForm = {
  room_id: '', guest_id: '',
  checkin_previsto: '', checkout_previsto: '',
  checkin_hora_prevista: '',
  quantidade_pessoas: 1, observacoes: '',
}

interface NovaReservaDialogProps {
  open: boolean
  onClose: () => void
  rooms: RoomOption[]
  guests: GuestOption[]
  hotelId: string
  onCreated: (reservation: ReservationWithRelations) => void
}

const NovaReservaDialog = memo(function NovaReservaDialog({
  open, onClose, rooms, guests, hotelId, onCreated,
}: NovaReservaDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Opções pré-computadas (não recalculam a cada render do form)
  const guestOptions = useMemo(
    () => guests.map(g => ({ value: g.id!, label: `${g.nome}${g.cpf ? ` • ${g.cpf}` : ''}` })),
    [guests]
  )
  const roomOptions = useMemo(
    () => rooms.map(r => ({ value: r.id!, label: `Quarto ${r.numero}${r.nome ? ` • ${r.nome}` : ''} • ${formatCurrency(r.diaria)}/noite` })),
    [rooms]
  )

  const selectedRoom = useMemo(() => rooms.find(r => r.id === form.room_id), [rooms, form.room_id])
  const nights = useMemo(
    () => form.checkin_previsto && form.checkout_previsto ? diffDays(form.checkin_previsto, form.checkout_previsto) : 0,
    [form.checkin_previsto, form.checkout_previsto]
  )
  const total = (selectedRoom?.diaria ?? 0) * nights

  function resetAndClose() {
    setForm(emptyForm)
    onClose()
  }

  async function handleSave() {
    if (!form.room_id || !form.guest_id || !form.checkin_previsto || !form.checkout_previsto) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (nights <= 0) { toast.error('Datas inválidas — checkout deve ser após check-in'); return }

    setSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        room_id: form.room_id,
        guest_id: form.guest_id,
        checkin_previsto: form.checkin_previsto,
        checkout_previsto: form.checkout_previsto,
        quantidade_pessoas: form.quantidade_pessoas,
        valor_diaria: selectedRoom!.diaria,
        valor_total: total,
        checkin_hora_prevista: form.checkin_hora_prevista || null,
        observacoes: form.observacoes,
        status: 'criada',
      })
      .select('*, room:rooms(id,numero,nome,diaria), guest:guests(id,nome,cpf,telefone)')
      .single()

    if (error) {
      toast.error('Erro ao criar reserva: ' + error.message)
      setSaving(false)
      return
    }

    await supabase.from('rooms').update({ status: 'reservado' }).eq('id', form.room_id)

    toast.success('Reserva criada com sucesso!')
    onCreated(data)
    resetAndClose()
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) resetAndClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hóspede */}
          <div className="space-y-1">
            <Label>Hóspede *</Label>
            <Select
              value={form.guest_id}
              onValueChange={v => setForm(f => ({ ...f, guest_id: v ?? '' }))}
            >
              <SelectTrigger>
                <SelectDisplay value={form.guest_id} options={guestOptions} placeholder="Selecione o hóspede" />
              </SelectTrigger>
              <SelectContent>
                {guests.map(g => (
                  <SelectItem key={g.id!} value={g.id!}>
                    {g.nome}{g.cpf ? ` • ${g.cpf}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quarto */}
          <div className="space-y-1">
            <Label>Quarto *</Label>
            <Select
              value={form.room_id}
              onValueChange={v => setForm(f => ({ ...f, room_id: v ?? '' }))}
            >
              <SelectTrigger>
                <SelectDisplay value={form.room_id} options={roomOptions} placeholder="Selecione o quarto" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map(r => (
                  <SelectItem key={r.id!} value={r.id!}>
                    Quarto {r.numero}{r.nome ? ` • ${r.nome}` : ''} • {formatCurrency(r.diaria)}/noite
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Check-in *</Label>
              <Input
                type="date"
                value={form.checkin_previsto}
                onChange={e => setForm(f => ({ ...f, checkin_previsto: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Check-out *</Label>
              <Input
                type="date"
                value={form.checkout_previsto}
                onChange={e => setForm(f => ({ ...f, checkout_previsto: e.target.value }))}
              />
            </div>
          </div>

          {/* Horário previsto do check-in */}
          <div className="space-y-1">
            <Label>Horário previsto de check-in</Label>
            <Input
              type="time"
              value={form.checkin_hora_prevista}
              onChange={e => setForm(f => ({ ...f, checkin_hora_prevista: e.target.value }))}
            />
          </div>

          {/* Pessoas */}
          <div className="space-y-1">
            <Label>Quantidade de Pessoas</Label>
            <Input
              type="number"
              min={1}
              value={form.quantidade_pessoas}
              onChange={e => setForm(f => ({ ...f, quantidade_pessoas: +e.target.value }))}
            />
          </div>

          {/* Resumo */}
          {nights > 0 && selectedRoom && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-800 font-medium">
                {nights} noite(s) × {formatCurrency(selectedRoom.diaria)} = <strong>{formatCurrency(total)}</strong>
              </p>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Criando...' : 'Criar Reserva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

// ─── Tabela de reservas memoizada ─────────────────────────────────────────────
interface ReservationsTableProps {
  reservations: ReservationWithRelations[]
  onUpdateStatus: (id: string, status: ReservationStatus) => void
}

const ReservationsTable = memo(function ReservationsTable({ reservations, onUpdateStatus }: ReservationsTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Nenhuma reserva encontrada</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Hóspede</TableHead>
            <TableHead>Quarto</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map(r => (
            <TableRow key={r.id} className="hover:bg-slate-50">
              <TableCell>
                <p className="font-medium">{r.guest?.nome}</p>
                <p className="text-xs text-slate-500">{r.guest?.telefone}</p>
              </TableCell>
              <TableCell>Quarto {r.room?.numero}</TableCell>
              <TableCell>
                <p>{formatDate(r.checkin_previsto)}</p>
                {r.checkin_hora_prevista && (
                  <p className="text-xs text-slate-500">{formatTime(r.checkin_hora_prevista)}</p>
                )}
              </TableCell>
              <TableCell>{formatDate(r.checkout_previsto)}</TableCell>
              <TableCell>{formatCurrency(r.valor_total)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${RESERVATION_STATUS_COLOR[r.status]}`}>
                  {RESERVATION_STATUS_LABEL[r.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {STATUS_FLOW[r.status].map(nextStatus => (
                    <Button
                      key={nextStatus}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => onUpdateStatus(r.id, nextStatus)}
                    >
                      {RESERVATION_STATUS_LABEL[nextStatus]}
                    </Button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
})

// ─── Componente principal ─────────────────────────────────────────────────────
interface ReservationsClientProps {
  reservations: ReservationWithRelations[]
  rooms: RoomOption[]
  guests: GuestOption[]
  hotelId: string
}

const statusFilterOptions = [
  { value: 'all', label: 'Todos os status' },
  ...Object.entries(RESERVATION_STATUS_LABEL).map(([k, v]) => ({ value: k, label: v })),
]

export function ReservationsClient({ reservations: initialReservations, rooms, guests, hotelId }: ReservationsClientProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const filtered = useMemo(() => reservations.filter(r => {
    const matchSearch = !search ||
      r.guest?.nome.toLowerCase().includes(search.toLowerCase()) ||
      r.room?.numero.includes(search)
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    return matchSearch && matchStatus
  }), [reservations, search, filterStatus])

  const handleCreated = useCallback((reservation: ReservationWithRelations) => {
    setReservations(prev => [reservation, ...prev])
    router.refresh()
  }, [router])

  const handleUpdateStatus = useCallback(async (id: string, newStatus: ReservationStatus) => {
    const supabase = createClient()
    const { error } = await supabase.from('reservations').update({ status: newStatus }).eq('id', id)
    if (error) { toast.error('Erro ao atualizar status'); return }
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    toast.success(`Status: ${RESERVATION_STATUS_LABEL[newStatus]}`)
    router.refresh()
  }, [router])

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
          <p className="text-slate-500 text-sm mt-1">{reservations.length} reserva(s)</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Nova Reserva
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por hóspede ou quarto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="w-44">
            <SelectDisplay value={filterStatus} options={statusFilterOptions} />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela memoizada — não re-renderiza quando o form do dialog muda */}
      <ReservationsTable reservations={filtered} onUpdateStatus={handleUpdateStatus} />

      {/* Dialog com estado isolado — não re-renderiza a tabela */}
      <NovaReservaDialog
        open={open}
        onClose={() => setOpen(false)}
        rooms={rooms}
        guests={guests}
        hotelId={hotelId}
        onCreated={handleCreated}
      />
    </div>
  )
}
