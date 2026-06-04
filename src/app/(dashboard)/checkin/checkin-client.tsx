'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Reservation, Profile } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatCurrency, RESERVATION_STATUS_LABEL, RESERVATION_STATUS_COLOR } from '@/lib/utils'
import { LogIn, User, BedDouble, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

type R = Reservation & { room?: { id: string; numero: string; nome?: string }; guest?: { id: string; nome: string; cpf?: string; telefone?: string } }

interface CheckinClientProps {
  reservations: R[]
  profile: Profile
}

export function CheckinClient({ reservations: initialReservations, profile }: CheckinClientProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [confirming, setConfirming] = useState<R | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCheckin() {
    if (!confirming) return
    setLoading(true)
    const now = new Date().toISOString()

    const { error: stayError } = await supabase.from('stays').insert({
      hotel_id: profile.hotel_id!,
      reservation_id: confirming.id,
      checkin_real: now,
      responsavel_checkin: profile.nome,
    })
    if (stayError) { toast.error('Erro ao registrar check-in'); setLoading(false); return }

    await supabase.from('reservations').update({ status: 'hospedado' }).eq('id', confirming.id)
    await supabase.from('rooms').update({ status: 'ocupado' }).eq('id', confirming.room_id)

    setReservations(reservations.filter(r => r.id !== confirming.id))
    toast.success(`Check-in realizado para ${confirming.guest?.nome}`)
    setConfirming(null)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Check-in</h1>
        <p className="text-slate-500 text-sm mt-1">{reservations.length} reserva(s) aguardando check-in</p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <LogIn className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum check-in pendente no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.map(r => (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className={`text-xs ${RESERVATION_STATUS_COLOR[r.status]}`}>
                    {RESERVATION_STATUS_LABEL[r.status]}
                  </Badge>
                  <span className="text-xs text-slate-400">{formatDate(r.checkin_previsto)}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <p className="font-medium text-slate-900">{r.guest?.nome}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-600">Quarto {r.room?.numero} {r.room?.nome ? `• ${r.room.nome}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-600">{formatDate(r.checkin_previsto)} → {formatDate(r.checkout_previsto)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(r.valor_total)}</p>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs" onClick={() => setConfirming(r)}>
                    <LogIn className="h-3.5 w-3.5 mr-1" /> Check-in
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!confirming} onOpenChange={() => setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Check-in</DialogTitle>
          </DialogHeader>
          {confirming && (
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>Hóspede:</strong> {confirming.guest?.nome}</p>
              <p><strong>Quarto:</strong> {confirming.room?.numero}</p>
              <p><strong>Check-in:</strong> {formatDate(confirming.checkin_previsto)}</p>
              <p><strong>Check-out:</strong> {formatDate(confirming.checkout_previsto)}</p>
              <p><strong>Total:</strong> {formatCurrency(confirming.valor_total)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>Cancelar</Button>
            <Button onClick={handleCheckin} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? 'Processando...' : 'Confirmar Check-in'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
