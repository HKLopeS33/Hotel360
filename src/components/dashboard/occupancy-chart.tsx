'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockData = [
  { day: 'Seg', ocupados: 12, livres: 8 },
  { day: 'Ter', ocupados: 15, livres: 5 },
  { day: 'Qua', ocupados: 18, livres: 2 },
  { day: 'Qui', ocupados: 14, livres: 6 },
  { day: 'Sex', ocupados: 19, livres: 1 },
  { day: 'Sáb', ocupados: 20, livres: 0 },
  { day: 'Dom', ocupados: 16, livres: 4 },
]

interface OccupancyChartProps {
  hotelId: string
}

export function OccupancyChart({ hotelId }: OccupancyChartProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Ocupação da Semana</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mockData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="ocupados" name="Ocupados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="livres" name="Livres" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
