'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Reservation, Profile, PaymentMethod } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { SelectDisplay } from '@/components/ui/select-display'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatDate, formatCurrency } from '@/lib/utils'
import { LogOut, User, BedDouble, Calendar, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type R = Reservation & { room?: { id: string; numero: string; nome?: string }; guest?: { id: string; nome: string; cpf?: string; telefone?: string } }

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
]

interface CheckoutClientProps {
  reservations: R[]
  profile: Profile
}

export function CheckoutClient({ reservations: initialReservations, profile }: CheckoutClientProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [confirming, setConfirming] = useState<R | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCheckout() {
    if (!confirming) return
    setLoading(true)
    const now = new Date().toISOString()

    await supabase.from('stays').update({ checkout_real: now, responsavel_checkout: profile.nome }).eq('reservation_id', confirming.id)
    await supabase.from('reservations').update({ status: 'checkout' }).eq('id', confirming.id)
    await supabase.from('rooms').update({ status: 'limpeza' }).eq('id', confirming.room_id)
    await supabase.from('payments').insert({
      hotel_id: profile.hotel_id!,
      reservation_id: confirming.id,
      valor: confirming.valor_total,
      forma_pagamento: paymentMethod,
      status: 'pago',
    })
    await supabase.from('cleaning_tasks').insert({
      hotel_id: profile.hotel_id!,
      room_id: confirming.room_id,
      status: 'aguardando',
    })

    const horaFormatada = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(now))
    setReservations(reservations.filter(r => r.id !== confirming.id))
    toast.success(`Check-out de ${confirming.guest?.nome} registrado às ${horaFormatada}`)
    setConfirming(null)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Check-out</h1>
        <p className="text-slate-500 text-sm mt-1">{reservations.length} hóspede(s) hospedado(s)</p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <LogOut className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum hóspede hospedado no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.map(r => (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <p className="font-medium text-slate-900">{r.guest?.nome}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-600">Quarto {r.room?.numero}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-600">Saída: {formatDate(r.checkout_previsto)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(r.valor_total)}</p>
                  </div>
                </div>
                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-xs" onClick={() => { setConfirming(r); setPaymentMethod('dinheiro') }}>
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Check-out
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!confirming} onOpenChange={() => setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Check-out</DialogTitle>
          </DialogHeader>
          {confirming && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm text-slate-700">
                <p><strong>Hóspede:</strong> {confirming.guest?.nome}</p>
                <p><strong>Quarto:</strong> {confirming.room?.numero}</p>
                <p><strong>Check-in:</strong> {formatDate(confirming.checkin_previsto)}</p>
                <p><strong>Check-out:</strong> {formatDate(confirming.checkout_previsto)}</p>
                <p className="text-base font-bold text-slate-900 pt-1"><strong>Total a pagar:</strong> {formatCurrency(confirming.valor_total)}</p>
              </div>
              <div className="space-y-1">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectDisplay value={paymentMethod} options={PAYMENT_METHODS.map(m => ({ value: m.value, label: m.label }))} />
                  </SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Horário de saída registrado:</span>
                <span className="font-semibold text-slate-900">{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}</span>
              </div>
              <p className="text-xs text-slate-500">O quarto será enviado para limpeza automaticamente.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>Cancelar</Button>
            <Button onClick={handleCheckout} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? 'Processando...' : 'Confirmar Check-out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
