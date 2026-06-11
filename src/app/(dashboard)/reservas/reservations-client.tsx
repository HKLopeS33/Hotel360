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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, formatDate, RESERVATION_STATUS_LABEL, RESERVATION_STATUS_COLOR, diffDays } from '@/lib/utils'

function formatTime(time: string | null | undefined): string {
  if (!time) return ''
  return time.slice(0, 5) // "HH:MM"
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = (h * 60 + m + hours * 60) % (24 * 60)
  const hh = Math.floor(total / 60).toString().padStart(2, '0')
  const mm = (total % 60).toString().padStart(2, '0')
  return `${hh}:${mm}`
}
import { Plus, Search, CalendarDays, Car, PawPrint, Coffee, Settings, Save, Clock } from 'lucide-react'
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

// ─── Card de configuração de reserva por hora ────────────────────────────────
const HourlyPricingCard = memo(function HourlyPricingCard({
  hotelId, valorHoraInicial, valorHoraAdicional,
}: { hotelId: string; valorHoraInicial: number; valorHoraAdicional: number }) {
  const [form, setForm] = useState({
    valor_hora_inicial: String(valorHoraInicial ?? 50),
    valor_hora_adicional: String(valorHoraAdicional ?? 0),
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('hotels').update({
      valor_hora_inicial: Number(form.valor_hora_inicial) || 0,
      valor_hora_adicional: Number(form.valor_hora_adicional) || 0,
    }).eq('id', hotelId)

    if (error) { toast.error('Erro ao salvar configurações: ' + error.message); setSaving(false); return }
    toast.success('Configurações salvas')
    setSaving(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">Reserva por Hora</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Defina os valores para reservas avulsas cobradas por hora
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1">
            <Label className="text-xs">Valor da 1ª hora</Label>
            <Input type="number" min={0} step="0.01" value={form.valor_hora_inicial} onChange={f('valor_hora_inicial')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valor por hora adicional</Label>
            <Input type="number" min={0} step="0.01" value={form.valor_hora_adicional} onChange={f('valor_hora_adicional')} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 mt-4">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  )
})

// ─── Dialog isolado com estado próprio ───────────────────────────────────────
const emptyForm = {
  room_id: '', guest_id: '',
  checkin_previsto: '', checkout_previsto: '',
  checkin_hora_prevista: '',
  quantidade_pessoas: 1, observacoes: '',
  tem_veiculo: false, quantidade_veiculos: 1,
  tem_pet: false, quantidade_pets: 1,
  tem_cafe: false,
  tipo_reserva: 'diaria' as 'diaria' | 'hora',
  quantidade_horas: 1,
}

const tipoReservaOptions = [
  { value: 'diaria', label: 'Diária / Pernoite' },
  { value: 'hora', label: 'Por Hora(s)' },
]

interface NovaReservaDialogProps {
  open: boolean
  onClose: () => void
  rooms: RoomOption[]
  guests: GuestOption[]
  hotelId: string
  valorCafePorPessoa: number
  valorHoraInicial: number
  valorHoraAdicional: number
  betaFeatures: boolean
  onCreated: (reservation: ReservationWithRelations) => void
}

const NovaReservaDialog = memo(function NovaReservaDialog({
  open, onClose, rooms, guests, hotelId, valorCafePorPessoa, valorHoraInicial, valorHoraAdicional, betaFeatures, onCreated,
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
  const isHourly = betaFeatures && form.tipo_reserva === 'hora'
  const cafeExtra = form.tem_cafe ? valorCafePorPessoa * form.quantidade_pessoas : 0
  const valorDiaria = (selectedRoom?.diaria ?? 0) + cafeExtra
  const horasExtra = Math.max(0, form.quantidade_horas - 1)
  const totalHora = valorHoraInicial + horasExtra * valorHoraAdicional
  const total = isHourly ? totalHora : valorDiaria * nights
  const checkoutHoraPrevista = isHourly && form.checkin_hora_prevista
    ? addHours(form.checkin_hora_prevista, form.quantidade_horas)
    : null

  function resetAndClose() {
    setForm(emptyForm)
    onClose()
  }

  async function handleSave() {
    if (!form.room_id || !form.guest_id || !form.checkin_previsto) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (isHourly) {
      if (form.quantidade_horas <= 0) { toast.error('Informe a quantidade de horas'); return }
    } else {
      if (!form.checkout_previsto) { toast.error('Preencha todos os campos obrigatórios'); return }
      if (nights <= 0) { toast.error('Datas inválidas — checkout deve ser após check-in'); return }
    }

    setSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        room_id: form.room_id,
        guest_id: form.guest_id,
        checkin_previsto: form.checkin_previsto,
        checkout_previsto: isHourly ? form.checkin_previsto : form.checkout_previsto,
        quantidade_pessoas: form.quantidade_pessoas,
        valor_diaria: isHourly ? valorHoraInicial : valorDiaria,
        valor_total: total,
        checkin_hora_prevista: form.checkin_hora_prevista || null,
        observacoes: form.observacoes,
        status: 'criada',
        tem_veiculo: form.tem_veiculo,
        quantidade_veiculos: form.tem_veiculo ? form.quantidade_veiculos : null,
        tem_pet: form.tem_pet,
        quantidade_pets: form.tem_pet ? form.quantidade_pets : null,
        tem_cafe: form.tem_cafe,
        tipo_reserva: form.tipo_reserva,
        quantidade_horas: isHourly ? form.quantidade_horas : null,
        checkout_hora_prevista: isHourly ? checkoutHoraPrevista : null,
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

          {/* Tipo de reserva */}
          {betaFeatures && (
            <div className="space-y-1">
              <Label>Tipo de Reserva</Label>
              <Select
                value={form.tipo_reserva}
                onValueChange={v => setForm(f => ({ ...f, tipo_reserva: (v as 'diaria' | 'hora') ?? 'diaria' }))}
              >
                <SelectTrigger>
                  <SelectDisplay value={form.tipo_reserva} options={tipoReservaOptions} />
                </SelectTrigger>
                <SelectContent>
                  {tipoReservaOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Datas */}
          {isHourly ? (
            <div className="space-y-1">
              <Label>Data *</Label>
              <Input
                type="date"
                value={form.checkin_previsto}
                onChange={e => setForm(f => ({ ...f, checkin_previsto: e.target.value }))}
              />
            </div>
          ) : (
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
          )}

          {/* Horário previsto do check-in / quantidade de horas */}
          {isHourly ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Horário de entrada</Label>
                <Input
                  type="time"
                  value={form.checkin_hora_prevista}
                  onChange={e => setForm(f => ({ ...f, checkin_hora_prevista: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Quantidade de horas</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantidade_horas}
                  onChange={e => setForm(f => ({ ...f, quantidade_horas: +e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Horário previsto de check-in</Label>
              <Input
                type="time"
                value={form.checkin_hora_prevista}
                onChange={e => setForm(f => ({ ...f, checkin_hora_prevista: e.target.value }))}
              />
            </div>
          )}

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

          {/* Veículos, pets e café da manhã */}
          {betaFeatures && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.tem_veiculo}
                onCheckedChange={(checked) => setForm(f => ({ ...f, tem_veiculo: checked === true }))}
              />
              <Label className="font-normal">Possui veículo(s)</Label>
            </div>
            {form.tem_veiculo && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">Quantidade de veículos</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantidade_veiculos}
                  onChange={e => setForm(f => ({ ...f, quantidade_veiculos: +e.target.value }))}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.tem_pet}
                onCheckedChange={(checked) => setForm(f => ({ ...f, tem_pet: checked === true }))}
              />
              <Label className="font-normal">Possui pet(s)</Label>
            </div>
            {form.tem_pet && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">Quantidade de pets</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantidade_pets}
                  onChange={e => setForm(f => ({ ...f, quantidade_pets: +e.target.value }))}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.tem_cafe}
                onCheckedChange={(checked) => setForm(f => ({ ...f, tem_cafe: checked === true }))}
              />
              <Label className="font-normal">
                Café da manhã{valorCafePorPessoa > 0 && ` (+ ${formatCurrency(valorCafePorPessoa)}/pessoa/diária)`}
              </Label>
            </div>
          </div>
          )}

          {/* Resumo */}
          {isHourly ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-800">
                1ª hora: {formatCurrency(valorHoraInicial)}
                {horasExtra > 0 && <> + {horasExtra}h adicional × {formatCurrency(valorHoraAdicional)}</>}
              </p>
              <p className="text-blue-800 font-medium">
                Total: <strong>{formatCurrency(total)}</strong>
                {checkoutHoraPrevista && <> — saída prevista às {checkoutHoraPrevista}</>}
              </p>
            </div>
          ) : (
            nights > 0 && selectedRoom && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800">
                  Diária: {formatCurrency(selectedRoom.diaria)}
                  {cafeExtra > 0 && <> + {formatCurrency(cafeExtra)} (café) = {formatCurrency(valorDiaria)}</>}
                </p>
                <p className="text-blue-800 font-medium">
                  {nights} noite(s) × {formatCurrency(valorDiaria)} = <strong>{formatCurrency(total)}</strong>
                </p>
              </div>
            )
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
  betaFeatures: boolean
}

const ReservationsTable = memo(function ReservationsTable({ reservations, onUpdateStatus, betaFeatures }: ReservationsTableProps) {
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
                {betaFeatures && (r.tem_veiculo || r.tem_pet || r.tem_cafe) && (
                  <div className="flex items-center gap-2 mt-1 text-slate-400">
                    {r.tem_veiculo && (
                      <span className="inline-flex items-center gap-1 text-xs"><Car className="h-3.5 w-3.5" /> {r.quantidade_veiculos ?? 1}</span>
                    )}
                    {r.tem_pet && (
                      <span className="inline-flex items-center gap-1 text-xs"><PawPrint className="h-3.5 w-3.5" /> {r.quantidade_pets ?? 1}</span>
                    )}
                    {r.tem_cafe && (
                      <span className="inline-flex items-center gap-1 text-xs"><Coffee className="h-3.5 w-3.5" /></span>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>Quarto {r.room?.numero}</TableCell>
              <TableCell>
                <p>{formatDate(r.checkin_previsto)}</p>
                {r.checkin_hora_prevista && (
                  <p className="text-xs text-slate-500">{formatTime(r.checkin_hora_prevista)}</p>
                )}
                {betaFeatures && r.tipo_reserva === 'hora' && (
                  <Badge variant="outline" className="text-xs mt-1 bg-purple-50 text-purple-700 border-purple-200">
                    <Clock className="h-3 w-3 mr-1" /> Por hora ({r.quantidade_horas}h)
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {betaFeatures && r.tipo_reserva === 'hora' ? (
                  <>
                    <p>{formatDate(r.checkout_previsto)}</p>
                    {r.checkout_hora_prevista && (
                      <p className="text-xs text-slate-500">{formatTime(r.checkout_hora_prevista)}</p>
                    )}
                  </>
                ) : (
                  formatDate(r.checkout_previsto)
                )}
              </TableCell>
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
  valorCafePorPessoa: number
  valorHoraInicial: number
  valorHoraAdicional: number
  canEditSettings: boolean
  betaFeatures: boolean
}

const statusFilterOptions = [
  { value: 'all', label: 'Todos os status' },
  ...Object.entries(RESERVATION_STATUS_LABEL).map(([k, v]) => ({ value: k, label: v })),
]

export function ReservationsClient({ reservations: initialReservations, rooms, guests, hotelId, valorCafePorPessoa, valorHoraInicial, valorHoraAdicional, canEditSettings, betaFeatures }: ReservationsClientProps) {
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

      {/* Configurações de reserva por hora */}
      {canEditSettings && betaFeatures && (
        <HourlyPricingCard
          hotelId={hotelId}
          valorHoraInicial={valorHoraInicial}
          valorHoraAdicional={valorHoraAdicional}
        />
      )}

      {/* Tabela memoizada — não re-renderiza quando o form do dialog muda */}
      <ReservationsTable reservations={filtered} onUpdateStatus={handleUpdateStatus} betaFeatures={betaFeatures} />

      {/* Dialog com estado isolado — não re-renderiza a tabela */}
      <NovaReservaDialog
        open={open}
        onClose={() => setOpen(false)}
        rooms={rooms}
        guests={guests}
        hotelId={hotelId}
        valorCafePorPessoa={valorCafePorPessoa}
        valorHoraInicial={valorHoraInicial}
        valorHoraAdicional={valorHoraAdicional}
        betaFeatures={betaFeatures}
        onCreated={handleCreated}
      />
    </div>
  )
}
