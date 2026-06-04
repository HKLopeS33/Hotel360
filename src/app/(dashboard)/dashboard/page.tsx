import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/auth'
import { requireAccess } from '@/lib/access'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { BedDouble, Users, LogIn, LogOut, DollarSign, TrendingUp, Calendar, Percent } from 'lucide-react'
import { OccupancyChart } from '@/components/dashboard/occupancy-chart'
import { RecentReservations } from '@/components/dashboard/recent-reservations'

export default async function DashboardPage() {
  const profile = await requireProfile()
  requireAccess(profile, 'dashboard')
  const supabase = await createClient()

  const hotelId = profile.hotel_id
  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [
    { data: rooms },
    { data: checkinsHoje },
    { data: checkoutsHoje },
    { data: receitaDiaria },
    { data: receitaMensal },
    { data: reservasRecentes },
  ] = await Promise.all([
    supabase.from('rooms').select('status').eq('hotel_id', hotelId!),
    supabase.from('reservations').select('id').eq('hotel_id', hotelId!).eq('checkin_previsto', today).in('status', ['confirmada', 'checkin']),
    supabase.from('reservations').select('id').eq('hotel_id', hotelId!).eq('checkout_previsto', today).eq('status', 'hospedado'),
    supabase.from('payments').select('valor').eq('hotel_id', hotelId!).eq('status', 'pago').gte('created_at', today),
    supabase.from('payments').select('valor').eq('hotel_id', hotelId!).eq('status', 'pago').gte('created_at', startOfMonth),
    supabase.from('reservations').select('*, room:rooms(numero,nome), guest:guests(nome)').eq('hotel_id', hotelId!).order('created_at', { ascending: false }).limit(5),
  ])

  const totalRooms = rooms?.length ?? 0
  const occupiedRooms = rooms?.filter(r => r.status === 'ocupado').length ?? 0
  const freeRooms = rooms?.filter(r => r.status === 'livre').length ?? 0
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
  const dailyRevenue = receitaDiaria?.reduce((s, p) => s + p.valor, 0) ?? 0
  const monthlyRevenue = receitaMensal?.reduce((s, p) => s + p.valor, 0) ?? 0

  const stats = [
    { title: 'Quartos Livres', value: freeRooms, icon: BedDouble, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Quartos Ocupados', value: occupiedRooms, icon: BedDouble, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Check-ins Hoje', value: checkinsHoje?.length ?? 0, icon: LogIn, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Check-outs Hoje', value: checkoutsHoje?.length ?? 0, icon: LogOut, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Receita Diária', value: formatCurrency(dailyRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Receita Mensal', value: formatCurrency(monthlyRevenue), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Total de Quartos', value: totalRooms, icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-50' },
    { title: 'Taxa de Ocupação', value: `${occupancyRate}%`, icon: Percent, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral do hotel hoje</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{title}</p>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OccupancyChart hotelId={hotelId!} />
        </div>
        <div>
          <RecentReservations reservations={reservasRecentes ?? []} />
        </div>
      </div>
    </div>
  )
}
