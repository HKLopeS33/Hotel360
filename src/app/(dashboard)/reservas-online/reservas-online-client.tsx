'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OnlineReservation } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { SelectDisplay } from '@/components/ui/select-display'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  formatCurrency, formatDate, formatTime, diffDays,
  ONLINE_RESERVATION_STATUS_LABEL, ONLINE_RESERVATION_STATUS_COLOR,
  ONLINE_PAYMENT_STATUS_LABEL, ONLINE_PAYMENT_STATUS_COLOR,
  ROOM_TYPE_OPTIONS, ROOM_TYPE_LABEL, TEMPLATE_OPTIONS,
} from '@/lib/utils'
import { Globe, Copy, Check, Car, Users as UsersIcon, PawPrint, Coffee, ParkingSquare, Settings, Save, Images, Upload, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { PhotoCarousel } from '@/components/photo-carousel'

type RoomOption = { id: string; numero: string; nome?: string; diaria: number; status: string }
type GuestOption = { id: string; nome: string; cpf?: string; telefone?: string }

interface OnlinePricing {
  online_valor_diaria: number | null
  online_valor_extra_pet: number
  online_valor_extra_cafe: number
  online_valor_extra_garagem: number
  online_valor_extra_veiculo: number
  online_taxa_cancelamento_pct: number
  politica_agendamento: string | null
  politica_pagamento: string | null
  politica_cancelamento: string | null
}

interface BrandingInfo {
  online_logo_url: string | null
  online_imagem_capa_url: string | null
  online_cor_primaria: string | null
  online_descricao: string | null
  online_template: string
  online_fotos_galeria: string[]
}

interface ReservasOnlineClientProps {
  onlineReservations: OnlineReservation[]
  rooms: RoomOption[]
  guests: GuestOption[]
  hotelId: string
  canEditSettings: boolean
  pricing: OnlinePricing
  quartosFotos: Record<string, string[]>
  quartosPrecos: Record<string, number>
  branding: BrandingInfo
  betaFeatures: boolean
}

// ─── Card de configuração de preços ──────────────────────────────────────────
const PricingSettingsCard = memo(function PricingSettingsCard({
  hotelId, pricing, betaFeatures,
}: { hotelId: string; pricing: OnlinePricing; betaFeatures: boolean }) {
  const [form, setForm] = useState({
    online_valor_diaria: pricing.online_valor_diaria != null ? String(pricing.online_valor_diaria) : '',
    online_valor_extra_pet: String(pricing.online_valor_extra_pet ?? 0),
    online_valor_extra_cafe: String(pricing.online_valor_extra_cafe ?? 0),
    online_valor_extra_garagem: String(pricing.online_valor_extra_garagem ?? 0),
    online_valor_extra_veiculo: String(pricing.online_valor_extra_veiculo ?? 0),
    online_taxa_cancelamento_pct: String(pricing.online_taxa_cancelamento_pct ?? 0),
    politica_agendamento: pricing.politica_agendamento ?? '',
    politica_pagamento: pricing.politica_pagamento ?? '',
    politica_cancelamento: pricing.politica_cancelamento ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('hotels').update({
      online_valor_diaria: form.online_valor_diaria ? Number(form.online_valor_diaria) : null,
      online_valor_extra_pet: Number(form.online_valor_extra_pet) || 0,
      online_valor_extra_cafe: Number(form.online_valor_extra_cafe) || 0,
      online_valor_extra_garagem: Number(form.online_valor_extra_garagem) || 0,
      online_valor_extra_veiculo: Number(form.online_valor_extra_veiculo) || 0,
      online_taxa_cancelamento_pct: Number(form.online_taxa_cancelamento_pct) || 0,
      politica_agendamento: form.politica_agendamento || null,
      politica_pagamento: form.politica_pagamento || null,
      politica_cancelamento: form.politica_cancelamento || null,
    }).eq('id', hotelId)

    if (error) { toast.error('Erro ao salvar configurações: ' + error.message); setSaving(false); return }
    toast.success('Configurações salvas')
    setSaving(false)
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  const ta = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Settings className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">Configurações de Reserva Online</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Defina os valores exibidos e cobrados no link público de reservas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Diária (estimativa)</Label>
            <Input type="number" min={0} step="0.01" placeholder="0,00" value={form.online_valor_diaria} onChange={f('online_valor_diaria')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Extra por pet</Label>
            <Input type="number" min={0} step="0.01" value={form.online_valor_extra_pet} onChange={f('online_valor_extra_pet')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Café da manhã{betaFeatures ? ' (por pessoa/diária)' : ' (custo adicional/diária)'}</Label>
            <Input type="number" min={0} step="0.01" value={form.online_valor_extra_cafe} onChange={f('online_valor_extra_cafe')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Garagem (custo adicional)</Label>
            <Input type="number" min={0} step="0.01" value={form.online_valor_extra_garagem} onChange={f('online_valor_extra_garagem')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Extra por veículo (por diária)</Label>
            <Input type="number" min={0} step="0.01" value={form.online_valor_extra_veiculo} onChange={f('online_valor_extra_veiculo')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Taxa de cancelamento (%)</Label>
            <Input type="number" min={0} max={100} step="0.01" value={form.online_taxa_cancelamento_pct} onChange={f('online_taxa_cancelamento_pct')} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="space-y-1">
            <Label className="text-xs">Política de agendamento</Label>
            <Textarea rows={4} placeholder="Ex: confirmação sujeita a disponibilidade..." value={form.politica_agendamento} onChange={ta('politica_agendamento')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Política de pagamento</Label>
            <Textarea rows={4} placeholder="Ex: pagamento via Pix, crédito ou débito..." value={form.politica_pagamento} onChange={ta('politica_pagamento')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Política de cancelamento</Label>
            <Textarea rows={4} placeholder="Ex: cancelamentos com reembolso descontando taxa..." value={form.politica_cancelamento} onChange={ta('politica_cancelamento')} />
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

// ─── Card de personalização da página pública ────────────────────────────────
const BrandingCard = memo(function BrandingCard({
  hotelId, branding,
}: { hotelId: string; branding: BrandingInfo }) {
  const [logoUrl, setLogoUrl] = useState(branding.online_logo_url ?? '')
  const [capaUrl, setCapaUrl] = useState(branding.online_imagem_capa_url ?? '')
  const [galeria, setGaleria] = useState<string[]>(branding.online_fotos_galeria ?? [])
  const [form, setForm] = useState({
    online_cor_primaria: branding.online_cor_primaria || '#2563eb',
    online_descricao: branding.online_descricao ?? '',
    online_template: branding.online_template || 'classico',
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCapa, setUploadingCapa] = useState(false)
  const [uploadingGaleria, setUploadingGaleria] = useState(false)
  const [saving, setSaving] = useState(false)

  async function uploadSingle(file: File, pasta: 'logo' | 'capa') {
    const supabase = createClient()
    const path = `${hotelId}/${pasta}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('hotel-branding').upload(path, file)
    if (error) { toast.error(`Erro ao enviar imagem: ${error.message}`); return null }
    return supabase.storage.from('hotel-branding').getPublicUrl(path).data.publicUrl
  }

  async function handleLogoChange(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingLogo(true)
    const url = await uploadSingle(files[0], 'logo')
    if (url) {
      const supabase = createClient()
      const { error } = await supabase.from('hotels').update({ online_logo_url: url }).eq('id', hotelId)
      if (error) { toast.error('Erro ao salvar logo: ' + error.message) } else { setLogoUrl(url); toast.success('Logo atualizada') }
    }
    setUploadingLogo(false)
  }

  async function handleCapaChange(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingCapa(true)
    const url = await uploadSingle(files[0], 'capa')
    if (url) {
      const supabase = createClient()
      const { error } = await supabase.from('hotels').update({ online_imagem_capa_url: url }).eq('id', hotelId)
      if (error) { toast.error('Erro ao salvar imagem de capa: ' + error.message) } else { setCapaUrl(url); toast.success('Imagem de capa atualizada') }
    }
    setUploadingCapa(false)
  }

  async function handleGaleriaChange(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingGaleria(true)
    const supabase = createClient()
    const novasUrls: string[] = []
    for (const file of Array.from(files)) {
      const path = `${hotelId}/galeria/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('hotel-branding').upload(path, file)
      if (error) { toast.error(`Erro ao enviar ${file.name}: ${error.message}`); continue }
      novasUrls.push(supabase.storage.from('hotel-branding').getPublicUrl(path).data.publicUrl)
    }
    if (novasUrls.length > 0) {
      const next = [...galeria, ...novasUrls]
      const { error } = await supabase.from('hotels').update({ online_fotos_galeria: next }).eq('id', hotelId)
      if (error) { toast.error('Erro ao salvar galeria: ' + error.message) } else { setGaleria(next); toast.success('Fotos adicionadas à galeria') }
    }
    setUploadingGaleria(false)
  }

  async function handleRemoveGaleria(index: number) {
    const next = galeria.filter((_, i) => i !== index)
    const supabase = createClient()
    const { error } = await supabase.from('hotels').update({ online_fotos_galeria: next }).eq('id', hotelId)
    if (error) { toast.error('Erro ao remover foto: ' + error.message); return }
    setGaleria(next)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('hotels').update({
      online_cor_primaria: form.online_cor_primaria || null,
      online_descricao: form.online_descricao || null,
      online_template: form.online_template,
    }).eq('id', hotelId)
    if (error) { toast.error('Erro ao salvar personalização: ' + error.message); setSaving(false); return }
    toast.success('Personalização salva')
    setSaving(false)
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Palette className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">Personalização da Página de Reserva</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Logo, imagem de capa, cores, descrição e modelo de página exibidos no link de reserva online
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Logo do hotel</Label>
            {logoUrl && (
              <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              {uploadingLogo ? 'Enviando...' : 'Enviar logo'}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={(e) => { handleLogoChange(e.target.files); e.target.value = '' }} />
            </label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Imagem de capa</Label>
            {capaUrl && (
              <div className="h-16 w-28 rounded-lg overflow-hidden border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capaUrl} alt="Capa" className="h-full w-full object-cover" />
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              {uploadingCapa ? 'Enviando...' : 'Enviar imagem de capa'}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingCapa} onChange={(e) => { handleCapaChange(e.target.files); e.target.value = '' }} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Cor principal</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-9 w-12 rounded border border-slate-200 cursor-pointer"
                value={form.online_cor_primaria}
                onChange={(e) => setForm(f => ({ ...f, online_cor_primaria: e.target.value }))}
              />
              <Input value={form.online_cor_primaria} onChange={(e) => setForm(f => ({ ...f, online_cor_primaria: e.target.value }))} className="max-w-32" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Modelo da página</Label>
            <Select value={form.online_template} onValueChange={v => setForm(f => ({ ...f, online_template: v ?? 'classico' }))}>
              <SelectTrigger>
                <SelectDisplay value={form.online_template} options={[...TEMPLATE_OPTIONS]} />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Descrição do hotel</Label>
          <Textarea rows={3} placeholder="Conte um pouco sobre o hotel para os hóspedes..." value={form.online_descricao} onChange={(e) => setForm(f => ({ ...f, online_descricao: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Galeria de fotos do hotel</Label>
            <label className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              {uploadingGaleria ? 'Enviando...' : 'Adicionar fotos'}
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingGaleria} onChange={(e) => { handleGaleriaChange(e.target.files); e.target.value = '' }} />
            </label>
          </div>
          <PhotoCarousel photos={galeria} emptyLabel="Nenhuma foto na galeria" onRemove={handleRemoveGaleria} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Personalização'}
        </Button>
      </CardContent>
    </Card>
  )
})

// ─── Card de fotos e preços por tipo de quarto ───────────────────────────────
const RoomPhotosCard = memo(function RoomPhotosCard({
  hotelId, quartosFotos, quartosPrecos,
}: { hotelId: string; quartosFotos: Record<string, string[]>; quartosPrecos: Record<string, number> }) {
  const [fotos, setFotos] = useState<Record<string, string[]>>(quartosFotos)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [precos, setPrecos] = useState<Record<string, string>>(
    Object.fromEntries(ROOM_TYPE_OPTIONS.map(({ value }) => [value, quartosPrecos[value] != null ? String(quartosPrecos[value]) : '']))
  )
  const [savingPrecos, setSavingPrecos] = useState(false)

  async function persist(next: Record<string, string[]>) {
    const supabase = createClient()
    const { error } = await supabase.from('hotels').update({ online_quartos_fotos: next }).eq('id', hotelId)
    if (error) { toast.error('Erro ao salvar fotos: ' + error.message); return false }
    return true
  }

  async function handleSavePrecos() {
    setSavingPrecos(true)
    const next: Record<string, number> = {}
    for (const { value } of ROOM_TYPE_OPTIONS) {
      if (precos[value]) next[value] = Number(precos[value])
    }
    const supabase = createClient()
    const { error } = await supabase.from('hotels').update({ online_quartos_precos: next }).eq('id', hotelId)
    if (error) { toast.error('Erro ao salvar valores: ' + error.message); setSavingPrecos(false); return }
    toast.success('Valores salvos')
    setSavingPrecos(false)
  }

  async function handleUpload(tipo: string, files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadingType(tipo)
    const supabase = createClient()
    const novasUrls: string[] = []

    for (const file of Array.from(files)) {
      const path = `${hotelId}/${tipo}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('room-photos').upload(path, file)
      if (error) { toast.error(`Erro ao enviar ${file.name}: ${error.message}`); continue }
      const { data } = supabase.storage.from('room-photos').getPublicUrl(path)
      novasUrls.push(data.publicUrl)
    }

    if (novasUrls.length > 0) {
      const next = { ...fotos, [tipo]: [...(fotos[tipo] ?? []), ...novasUrls] }
      if (await persist(next)) {
        setFotos(next)
        toast.success('Fotos enviadas')
      }
    }
    setUploadingType(null)
  }

  async function handleRemove(tipo: string, index: number) {
    const next = { ...fotos, [tipo]: (fotos[tipo] ?? []).filter((_, i) => i !== index) }
    if (await persist(next)) setFotos(next)
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Images className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-base">Tipos de Quarto: Fotos e Valores</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Defina o valor da diária e anexe fotos para cada tipo de quarto exibido no link de reserva online
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROOM_TYPE_OPTIONS.map(({ value, label }) => (
          <div key={value} className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-sm font-medium">{label}</Label>
              <label className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                {uploadingType === value ? 'Enviando...' : 'Adicionar fotos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploadingType === value}
                  onChange={(e) => { handleUpload(value, e.target.files); e.target.value = '' }}
                />
              </label>
            </div>
            <div className="max-w-xs space-y-1">
              <Label className="text-xs">Valor da diária</Label>
              <Input
                type="number" min={0} step="0.01" placeholder="Usar valor padrão"
                value={precos[value]}
                onChange={(e) => setPrecos(prev => ({ ...prev, [value]: e.target.value }))}
              />
            </div>
            <PhotoCarousel
              photos={fotos[value] ?? []}
              emptyLabel={`Nenhuma foto de quarto ${label}`}
              onRemove={(i) => handleRemove(value, i)}
            />
          </div>
        ))}

        <Button onClick={handleSavePrecos} disabled={savingPrecos} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          {savingPrecos ? 'Salvando...' : 'Salvar Valores'}
        </Button>
      </CardContent>
    </Card>
  )
})

// ─── Dialog de aprovação ──────────────────────────────────────────────────────
interface AprovarDialogProps {
  reservation: OnlineReservation | null
  rooms: RoomOption[]
  guests: GuestOption[]
  hotelId: string
  pricing: OnlinePricing
  betaFeatures: boolean
  onClose: () => void
  onApproved: (id: string) => void
}

const AprovarDialog = memo(function AprovarDialog({
  reservation, rooms, guests, hotelId, pricing, betaFeatures, onClose, onApproved,
}: AprovarDialogProps) {
  const [roomId, setRoomId] = useState('')
  const [saving, setSaving] = useState(false)

  const roomOptions = useMemo(
    () => rooms.map(r => ({ value: r.id, label: `Quarto ${r.numero}${r.nome ? ` • ${r.nome}` : ''} • ${formatCurrency(r.diaria)}/noite${r.status !== 'livre' ? ` • ${r.status}` : ''}` })),
    [rooms]
  )

  const selectedRoom = useMemo(() => rooms.find(r => r.id === roomId), [rooms, roomId])
  const nights = reservation ? diffDays(reservation.checkin_previsto, reservation.checkout_previsto) : 0

  const extrasDiaria =
    (reservation?.tem_pet ? (pricing.online_valor_extra_pet ?? 0) : 0) +
    (reservation?.tem_cafe
      ? (pricing.online_valor_extra_cafe ?? 0) * (betaFeatures ? (reservation?.quantidade_pessoas ?? 1) : 1)
      : 0) +
    (reservation?.tem_veiculo
      ? (pricing.online_valor_extra_veiculo ?? 0) * (reservation?.quantidade_veiculos ?? 1)
      : 0)
  const valorDiaria = (selectedRoom?.diaria ?? 0) + extrasDiaria
  const garagemExtra = reservation?.tem_garagem ? (pricing.online_valor_extra_garagem ?? 0) : 0
  const total = valorDiaria * nights + garagemExtra

  function resetAndClose() {
    setRoomId('')
    onClose()
  }

  async function handleApprove() {
    if (!reservation) return
    if (!roomId) { toast.error('Selecione um quarto'); return }
    if (nights <= 0) { toast.error('Datas inválidas'); return }

    setSaving(true)
    const supabase = createClient()

    // Encontrar ou criar hóspede
    let guestId = reservation.cpf
      ? guests.find(g => g.cpf && g.cpf === reservation.cpf)?.id
      : undefined

    if (!guestId) {
      const { data: newGuest, error: guestError } = await supabase
        .from('guests')
        .insert({
          hotel_id: hotelId,
          nome: reservation.nome,
          cpf: reservation.cpf || undefined,
          rg: reservation.rg || undefined,
          telefone: reservation.telefone,
          email: reservation.email || undefined,
        })
        .select('id')
        .single()

      if (guestError) {
        toast.error('Erro ao cadastrar hóspede: ' + guestError.message)
        setSaving(false)
        return
      }
      guestId = newGuest.id
    }

    const { error: reservationError } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotelId,
        room_id: roomId,
        guest_id: guestId,
        checkin_previsto: reservation.checkin_previsto,
        checkout_previsto: reservation.checkout_previsto,
        checkin_hora_prevista: reservation.horario_chegada_previsto || null,
        quantidade_pessoas: reservation.quantidade_pessoas,
        valor_diaria: valorDiaria,
        valor_total: total,
        observacoes: reservation.observacoes || undefined,
        status: 'criada',
      })

    if (reservationError) {
      toast.error('Erro ao criar reserva: ' + reservationError.message)
      setSaving(false)
      return
    }

    await supabase.from('rooms').update({ status: 'reservado' }).eq('id', roomId)
    await supabase.from('online_reservations').update({ status: 'aprovada' }).eq('id', reservation.id)

    toast.success('Solicitação aprovada e reserva criada!')
    onApproved(reservation.id)
    resetAndClose()
    setSaving(false)
  }

  if (!reservation) return null

  return (
    <Dialog open={!!reservation} onOpenChange={o => { if (!o) resetAndClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aprovar Solicitação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm space-y-1">
            <p><strong>{reservation.nome}</strong> • {reservation.telefone}</p>
            <p>{formatDate(reservation.checkin_previsto)} → {formatDate(reservation.checkout_previsto)} ({nights} noite(s)){reservation.tipo_quarto ? ` • ${ROOM_TYPE_LABEL[reservation.tipo_quarto] ?? reservation.tipo_quarto}` : ''}</p>
            <p>{reservation.quantidade_pessoas} pessoa(s){reservation.tem_veiculo ? ` • ${reservation.quantidade_veiculos ?? 1} veículo(s)` : ''}{reservation.tem_pet ? ' • com pet' : ''}{reservation.tem_cafe ? ' • café da manhã' : ''}{reservation.tem_garagem ? ' • garagem' : ''}</p>
          </div>

          <div className="space-y-1">
            <Label>Quarto *</Label>
            <Select value={roomId} onValueChange={v => setRoomId(v ?? '')}>
              <SelectTrigger>
                <SelectDisplay value={roomId} options={roomOptions} placeholder="Selecione o quarto" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    Quarto {r.numero}{r.nome ? ` • ${r.nome}` : ''} • {formatCurrency(r.diaria)}/noite{r.status !== 'livre' ? ` • ${r.status}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {nights > 0 && selectedRoom && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-1">
              <p className="text-blue-800">
                Diária: {formatCurrency(selectedRoom.diaria)}
                {extrasDiaria > 0 && <> + {formatCurrency(extrasDiaria)} (extras) = {formatCurrency(valorDiaria)}</>}
              </p>
              {garagemExtra > 0 && (
                <p className="text-blue-800">Garagem: {formatCurrency(garagemExtra)}</p>
              )}
              <p className="text-blue-800 font-medium">
                {nights} noite(s) × {formatCurrency(valorDiaria)}{garagemExtra > 0 ? ` + ${formatCurrency(garagemExtra)}` : ''} = <strong>{formatCurrency(total)}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>Cancelar</Button>
          <Button onClick={handleApprove} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Aprovando...' : 'Aprovar e Criar Reserva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

// ─── Tabela memoizada ──────────────────────────────────────────────────────────
interface ReservasTableProps {
  reservations: OnlineReservation[]
  onAprovar: (r: OnlineReservation) => void
  onRecusar: (id: string) => void
  onCancelarReembolso: (r: OnlineReservation) => void
  cancelandoId: string | null
}

const ReservasTable = memo(function ReservasTable({ reservations, onAprovar, onRecusar, onCancelarReembolso, cancelandoId }: ReservasTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Nenhuma solicitação de reserva online</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Solicitante</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Tipo de Quarto</TableHead>
            <TableHead>Pessoas / Veículos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map(r => (
            <TableRow key={r.id} className="hover:bg-slate-50">
              <TableCell>
                <p className="font-medium">{r.nome}</p>
                <p className="text-xs text-slate-500">{r.cpf}</p>
              </TableCell>
              <TableCell>
                <p>{r.telefone}</p>
                {r.email && <p className="text-xs text-slate-500">{r.email}</p>}
              </TableCell>
              <TableCell>
                <p>{formatDate(r.checkin_previsto)}</p>
                {r.horario_chegada_previsto && (
                  <p className="text-xs text-slate-500">{formatTime(r.horario_chegada_previsto)}</p>
                )}
              </TableCell>
              <TableCell>{formatDate(r.checkout_previsto)}</TableCell>
              <TableCell>{r.tipo_quarto ? (ROOM_TYPE_LABEL[r.tipo_quarto] ?? r.tipo_quarto) : '—'}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1"><UsersIcon className="h-3.5 w-3.5" /> {r.quantidade_pessoas}</span>
                {r.tem_veiculo && (
                  <span className="inline-flex items-center gap-1 ml-2"><Car className="h-3.5 w-3.5" /> {r.quantidade_veiculos ?? 1}</span>
                )}
                {r.tem_pet && (
                  <span className="inline-flex items-center gap-1 ml-2"><PawPrint className="h-3.5 w-3.5" /></span>
                )}
                {r.tem_cafe && (
                  <span className="inline-flex items-center gap-1 ml-2"><Coffee className="h-3.5 w-3.5" /></span>
                )}
                {r.tem_garagem && (
                  <span className="inline-flex items-center gap-1 ml-2"><ParkingSquare className="h-3.5 w-3.5" /></span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${ONLINE_RESERVATION_STATUS_COLOR[r.status]}`}>
                  {ONLINE_RESERVATION_STATUS_LABEL[r.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${ONLINE_PAYMENT_STATUS_COLOR[r.payment_status]}`}>
                  {ONLINE_PAYMENT_STATUS_LABEL[r.payment_status]}
                </Badge>
                {r.valor_total != null && (
                  <p className="text-xs text-slate-500 mt-1">{formatCurrency(r.valor_total)}</p>
                )}
              </TableCell>
              <TableCell>
                {r.status === 'pendente' && (
                  <div className="flex gap-1 flex-wrap">
                    <Button variant="outline" size="sm" className="text-xs h-7 px-2 text-green-700 border-green-300 hover:bg-green-50" onClick={() => onAprovar(r)}>
                      Aprovar
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7 px-2 text-red-700 border-red-300 hover:bg-red-50" onClick={() => onRecusar(r.id)}>
                      Recusar
                    </Button>
                  </div>
                )}
                {r.status === 'aprovada' && r.payment_status === 'pago' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2 text-red-700 border-red-300 hover:bg-red-50"
                    disabled={cancelandoId === r.id}
                    onClick={() => onCancelarReembolso(r)}
                  >
                    {cancelandoId === r.id ? 'Processando...' : 'Cancelar e Reembolsar'}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
})

// ─── Componente principal ─────────────────────────────────────────────────────
export function ReservasOnlineClient({ onlineReservations: initial, rooms, guests, hotelId, canEditSettings, pricing, quartosFotos, quartosPrecos, branding, betaFeatures }: ReservasOnlineClientProps) {
  const [reservations, setReservations] = useState(initial)
  const [aprovando, setAprovando] = useState<OnlineReservation | null>(null)
  const [copied, setCopied] = useState(false)
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const router = useRouter()

  const pendentesCount = useMemo(() => reservations.filter(r => r.status === 'pendente').length, [reservations])

  const handleCopyLink = useCallback(async () => {
    const link = `${window.location.origin}/reservar/${hotelId}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }, [hotelId])

  const handleApproved = useCallback((id: string) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'aprovada' } : r))
    setAprovando(null)
    router.refresh()
  }, [router])

  const handleRecusar = useCallback(async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('online_reservations').update({ status: 'recusada' }).eq('id', id)
    if (error) { toast.error('Erro ao recusar solicitação'); return }
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'recusada' } : r))
    toast.success('Solicitação recusada')
    router.refresh()
  }, [router])

  const handleCancelarReembolso = useCallback(async (r: OnlineReservation) => {
    if (!confirm(`Cancelar a reserva de ${r.nome} e reembolsar o pagamento (descontando a taxa de cancelamento)?`)) return
    setCancelandoId(r.id)
    try {
      const res = await fetch('/api/mercadopago/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: r.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao processar reembolso')
        setCancelandoId(null)
        return
      }
      setReservations(prev => prev.map(item => item.id === r.id ? { ...item, status: 'recusada', payment_status: 'reembolsado' } : item))
      toast.success(`Reserva cancelada e reembolso de ${formatCurrency(data.valorReembolso)} processado`)
    } catch {
      toast.error('Erro ao processar reembolso')
    }
    setCancelandoId(null)
    router.refresh()
  }, [router])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservas Online</h1>
          <p className="text-slate-500 text-sm mt-1">
            {reservations.length} solicitação(ões) • {pendentesCount} pendente(s)
          </p>
        </div>
        <Button onClick={handleCopyLink} variant="outline">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          Copiar Link de Reserva
        </Button>
      </div>

      {canEditSettings && <PricingSettingsCard hotelId={hotelId} pricing={pricing} betaFeatures={betaFeatures} />}
      {canEditSettings && <BrandingCard hotelId={hotelId} branding={branding} />}
      {canEditSettings && <RoomPhotosCard hotelId={hotelId} quartosFotos={quartosFotos} quartosPrecos={quartosPrecos} />}

      <ReservasTable
        reservations={reservations}
        onAprovar={setAprovando}
        onRecusar={handleRecusar}
        onCancelarReembolso={handleCancelarReembolso}
        cancelandoId={cancelandoId}
      />

      <AprovarDialog
        reservation={aprovando}
        rooms={rooms}
        guests={guests}
        hotelId={hotelId}
        pricing={pricing}
        betaFeatures={betaFeatures}
        onClose={() => setAprovando(null)}
        onApproved={handleApproved}
      />
    </div>
  )
}
