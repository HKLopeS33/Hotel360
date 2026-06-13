'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { SelectDisplay } from '@/components/ui/select-display'
import { PhotoCarousel } from '@/components/photo-carousel'
import { formatCurrency, diffDays, ROOM_TYPE_OPTIONS } from '@/lib/utils'
import { PaymentBrick } from './payment-brick'

interface OnlinePricing {
  online_valor_diaria: number | null
  online_valor_extra_pet: number
  online_valor_extra_cafe: number
  online_valor_extra_garagem: number
  online_valor_extra_veiculo: number
}

interface ReservaPolicies {
  politica_agendamento: string | null
  politica_pagamento: string | null
  politica_cancelamento: string | null
}

interface ReservaFormProps {
  hotelId: string
  hotelNome: string
  pricing: OnlinePricing
  policies: ReservaPolicies
  mpPublicKey: string | null
  quartosFotos: Record<string, string[]>
  betaFeatures: boolean
}

const emptyForm = {
  nome: '', cpf: '', rg: '', telefone: '', email: '',
  tipo_quarto: '',
  quantidade_pessoas: 1, tem_veiculo: false, quantidade_veiculos: 1, tem_pet: false,
  tem_cafe: false, tem_garagem: false,
  checkin_previsto: '', checkout_previsto: '', horario_chegada_previsto: '',
  observacoes: '',
}

const hasPolicies = (policies: ReservaPolicies) =>
  !!(policies.politica_agendamento || policies.politica_pagamento || policies.politica_cancelamento)

export function ReservaForm({ hotelId, hotelNome, pricing, policies, mpPublicKey, quartosFotos, betaFeatures }: ReservaFormProps) {
  const [form, setForm] = useState(emptyForm)
  const [aceitePoliticas, setAceitePoliticas] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<{ status: string; status_detail?: string } | null>(null)

  const nights = useMemo(
    () => form.checkin_previsto && form.checkout_previsto ? diffDays(form.checkin_previsto, form.checkout_previsto) : 0,
    [form.checkin_previsto, form.checkout_previsto]
  )

  const extrasDiaria = useMemo(() =>
    (form.tem_pet ? pricing.online_valor_extra_pet : 0) +
    (form.tem_cafe ? pricing.online_valor_extra_cafe * (betaFeatures ? form.quantidade_pessoas : 1) : 0) +
    (form.tem_veiculo ? pricing.online_valor_extra_veiculo * form.quantidade_veiculos : 0)
  , [pricing, form.tem_pet, form.tem_cafe, form.tem_veiculo, form.quantidade_pessoas, form.quantidade_veiculos, betaFeatures])

  const valorDiaria = (pricing.online_valor_diaria ?? 0) + extrasDiaria
  const garagem = form.tem_garagem ? pricing.online_valor_extra_garagem : 0

  const estimativa = useMemo(() => {
    if (pricing.online_valor_diaria == null || nights <= 0) return null
    return valorDiaria * nights + garagem
  }, [pricing.online_valor_diaria, nights, valorDiaria, garagem])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.nome || !form.telefone || !form.checkin_previsto || !form.checkout_previsto) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    if (new Date(form.checkout_previsto) <= new Date(form.checkin_previsto)) {
      toast.error('A data de saída deve ser após a data de entrada')
      return
    }
    if (hasPolicies(policies) && !aceitePoliticas) {
      toast.error('Você precisa ler e aceitar as políticas para continuar')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase.from('online_reservations').insert({
      hotel_id: hotelId,
      nome: form.nome,
      cpf: form.cpf || null,
      rg: form.rg || null,
      telefone: form.telefone,
      email: form.email || null,
      quantidade_pessoas: form.quantidade_pessoas,
      tem_veiculo: form.tem_veiculo,
      quantidade_veiculos: form.tem_veiculo ? form.quantidade_veiculos : null,
      tem_pet: form.tem_pet,
      tem_cafe: form.tem_cafe,
      tem_garagem: form.tem_garagem,
      tipo_quarto: form.tipo_quarto || null,
      checkin_previsto: form.checkin_previsto,
      checkout_previsto: form.checkout_previsto,
      horario_chegada_previsto: form.horario_chegada_previsto || null,
      observacoes: form.observacoes || null,
      status: 'pendente',
      valor_total: estimativa,
      aceite_politicas: hasPolicies(policies) ? aceitePoliticas : true,
    }).select('id').single()

    if (error) {
      toast.error('Erro ao enviar solicitação: ' + error.message)
      setSaving(false)
      return
    }

    if (mpPublicKey && estimativa && estimativa > 0) {
      setReservationId(data.id)
    } else {
      setDone(true)
    }
    setSaving(false)
  }

  if (done) {
    const aprovado = paymentStatus?.status === 'approved'
    const pendente = paymentStatus?.status === 'pending' || paymentStatus?.status === 'in_process'
    const recusado = paymentStatus?.status === 'rejected' || paymentStatus?.status === 'error'

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Solicitação enviada!</h2>
        <p className="text-slate-500 mt-2">
          Sua solicitação de reserva para o {hotelNome} foi enviada com sucesso. Em breve nossa equipe entrará em contato para confirmar.
        </p>
        {aprovado && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            Pagamento aprovado! Sua reserva já está paga.
          </p>
        )}
        {pendente && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
            Pagamento em processamento. Você será avisado assim que for confirmado.
          </p>
        )}
        {recusado && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            Não foi possível confirmar o pagamento agora. O hotel entrará em contato para combinar o pagamento.
          </p>
        )}
      </div>
    )
  }

  if (reservationId && mpPublicKey) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pagamento da Reserva</h2>
          <p className="text-sm text-slate-500">
            Total: <strong>{formatCurrency(estimativa ?? 0)}</strong> — escolha Pix, crédito ou débito.
          </p>
        </div>
        <PaymentBrick
          publicKey={mpPublicKey}
          amount={estimativa ?? 0}
          payerEmail={form.email || undefined}
          reservationId={reservationId}
          hotelId={hotelId}
          onResult={(result) => {
            setPaymentStatus(result)
            setDone(true)
          }}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Solicitar Reserva</h2>
        <p className="text-sm text-slate-500">Preencha seus dados para solicitar uma reserva no {hotelNome}.</p>
      </div>

      <div className="space-y-1">
        <Label>Nome completo *</Label>
        <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>CPF</Label>
          <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>RG</Label>
          <Input value={form.rg} onChange={e => setForm(f => ({ ...f, rg: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Telefone *</Label>
          <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label>E-mail</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Tipo de quarto</Label>
        <Select
          value={form.tipo_quarto}
          onValueChange={v => setForm(f => ({ ...f, tipo_quarto: v ?? '' }))}
        >
          <SelectTrigger>
            <SelectDisplay value={form.tipo_quarto} options={[...ROOM_TYPE_OPTIONS]} placeholder="Sem preferência" />
          </SelectTrigger>
          <SelectContent>
            {ROOM_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {form.tipo_quarto && (quartosFotos[form.tipo_quarto]?.length ?? 0) > 0 && (
          <PhotoCarousel photos={quartosFotos[form.tipo_quarto] ?? []} className="mt-2" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Check-in (entrada) *</Label>
          <Input type="date" value={form.checkin_previsto} onChange={e => setForm(f => ({ ...f, checkin_previsto: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label>Check-out (saída) *</Label>
          <Input type="date" value={form.checkout_previsto} onChange={e => setForm(f => ({ ...f, checkout_previsto: e.target.value }))} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Horário previsto de chegada</Label>
          <Input type="time" value={form.horario_chegada_previsto} onChange={e => setForm(f => ({ ...f, horario_chegada_previsto: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Quantidade de pessoas</Label>
          <Input type="number" min={1} value={form.quantidade_pessoas} onChange={e => setForm(f => ({ ...f, quantidade_pessoas: +e.target.value }))} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.tem_veiculo}
            onCheckedChange={(checked) => setForm(f => ({ ...f, tem_veiculo: checked === true }))}
          />
          <Label>Vou levar veículo(s){pricing.online_valor_extra_veiculo > 0 && ` (+ ${formatCurrency(pricing.online_valor_extra_veiculo)}/diária)`}</Label>
        </div>
        {form.tem_veiculo && (
          <div className="space-y-1">
            <Label>Quantidade de veículos</Label>
            <Input type="number" min={1} value={form.quantidade_veiculos} onChange={e => setForm(f => ({ ...f, quantidade_veiculos: +e.target.value }))} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.tem_pet}
            onCheckedChange={(checked) => setForm(f => ({ ...f, tem_pet: checked === true }))}
          />
          <Label>Vou levar pet{pricing.online_valor_extra_pet > 0 && ` (+ ${formatCurrency(pricing.online_valor_extra_pet)}/diária)`}</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.tem_cafe}
            onCheckedChange={(checked) => setForm(f => ({ ...f, tem_cafe: checked === true }))}
          />
          <Label>Café da manhã{pricing.online_valor_extra_cafe > 0 && ` (+ ${formatCurrency(pricing.online_valor_extra_cafe)}${betaFeatures ? '/pessoa' : ''}/diária)`}</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.tem_garagem}
            onCheckedChange={(checked) => setForm(f => ({ ...f, tem_garagem: checked === true }))}
          />
          <Label>Garagem{pricing.online_valor_extra_garagem > 0 && ` (+ ${formatCurrency(pricing.online_valor_extra_garagem)})`}</Label>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Observações</Label>
        <Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} />
      </div>

      {estimativa != null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-1">
          <p className="text-blue-800">
            Diária: {formatCurrency(pricing.online_valor_diaria ?? 0)}
            {extrasDiaria > 0 && <> + {formatCurrency(extrasDiaria)} (extras) = {formatCurrency(valorDiaria)}</>}
          </p>
          {garagem > 0 && (
            <p className="text-blue-800">Garagem: {formatCurrency(garagem)}</p>
          )}
          <p className="text-blue-800 font-medium">
            {nights} noite(s) — valor estimado: <strong>{formatCurrency(estimativa)}</strong>
          </p>
          <p className="text-xs text-blue-700 mt-1">O valor final será confirmado pelo hotel.</p>
        </div>
      )}

      {hasPolicies(policies) && (
        <div className="space-y-3 border border-slate-200 rounded-lg p-3">
          {policies.politica_agendamento && (
            <div>
              <p className="text-sm font-medium text-slate-900">Política de agendamento</p>
              <p className="text-xs text-slate-600 whitespace-pre-line mt-1">{policies.politica_agendamento}</p>
            </div>
          )}
          {policies.politica_pagamento && (
            <div>
              <p className="text-sm font-medium text-slate-900">Política de pagamento</p>
              <p className="text-xs text-slate-600 whitespace-pre-line mt-1">{policies.politica_pagamento}</p>
            </div>
          )}
          {policies.politica_cancelamento && (
            <div>
              <p className="text-sm font-medium text-slate-900">Política de cancelamento</p>
              <p className="text-xs text-slate-600 whitespace-pre-line mt-1">{policies.politica_cancelamento}</p>
            </div>
          )}
          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              checked={aceitePoliticas}
              onCheckedChange={(checked) => setAceitePoliticas(checked === true)}
            />
            <Label className="font-normal leading-snug">
              Li e estou de acordo com as políticas de agendamento, pagamento e cancelamento acima.
            </Label>
          </div>
        </div>
      )}

      <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
        {saving ? 'Enviando...' : 'Enviar Solicitação'}
      </Button>
    </form>
  )
}
