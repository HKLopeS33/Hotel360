import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, RESERVATION_STATUS_LABEL, RESERVATION_STATUS_COLOR } from '@/lib/utils'
import { Reservation } from '@/types/database'

interface RecentReservationsProps {
  reservations: (Reservation & { room?: { numero: string; nome?: string }; guest?: { nome: string } })[]
}

export function RecentReservations({ reservations }: RecentReservationsProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Reservas Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Nenhuma reserva encontrada</p>
        ) : (
          <div className="space-y-3">
            {reservations.map(r => (
              <div key={r.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{r.guest?.nome}</p>
                  <p className="text-xs text-slate-500">Quarto {r.room?.numero} • {formatDate(r.checkin_previsto)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${RESERVATION_STATUS_COLOR[r.status]}`}
                >
                  {RESERVATION_STATUS_LABEL[r.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
