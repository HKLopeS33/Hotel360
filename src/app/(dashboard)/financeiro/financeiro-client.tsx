'use client'

import { Payment } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { DollarSign, TrendingUp, CreditCard, Banknote } from 'lucide-react'

type PaymentWithRelations = Payment & {
  reservation?: {
    checkin_previsto: string
    checkout_previsto: string
    guest?: { nome: string }
    room?: { numero: string }
  }
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  pix: 'PIX',
  transferencia: 'Transferência',
}

const STATUS_COLOR: Record<string, string> = {
  pendente: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  pago: 'text-green-600 bg-green-50 border-green-200',
  cancelado: 'text-red-600 bg-red-50 border-red-200',
  estornado: 'text-orange-600 bg-orange-50 border-orange-200',
}

interface FinanceiroClientProps {
  payments: PaymentWithRelations[]
}

export function FinanceiroClient({ payments }: FinanceiroClientProps) {
  const paid = payments.filter(p => p.status === 'pago')
  const pending = payments.filter(p => p.status === 'pendente')
  const totalPaid = paid.reduce((s, p) => s + p.valor, 0)
  const totalPending = pending.reduce((s, p) => s + p.valor, 0)

  const byMethod = Object.entries(
    paid.reduce((acc, p) => {
      acc[p.forma_pagamento] = (acc[p.forma_pagamento] ?? 0) + p.valor
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
        <p className="text-slate-500 text-sm mt-1">Resumo do mês atual</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Receita do Mês</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">A Receber</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPending)}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg"><DollarSign className="h-5 w-5 text-yellow-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Transações</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{paid.length}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg"><CreditCard className="h-5 w-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Ticket Médio</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(paid.length ? totalPaid / paid.length : 0)}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg"><Banknote className="h-5 w-5 text-purple-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {byMethod.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recebimentos por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {byMethod.map(([method, value]) => (
                <div key={method} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-36">{PAYMENT_METHOD_LABEL[method] ?? method}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(value / totalPaid) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-900 w-24 text-right">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lançamentos do Mês</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="text-center py-8 text-slate-500 text-sm">Nenhum lançamento no mês</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Hóspede</TableHead>
                  <TableHead>Quarto</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{p.reservation?.guest?.nome ?? '—'}</TableCell>
                    <TableCell>{p.reservation?.room?.numero ? `Quarto ${p.reservation.room.numero}` : '—'}</TableCell>
                    <TableCell>{PAYMENT_METHOD_LABEL[p.forma_pagamento]}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(p.valor)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLOR[p.status]}`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">{formatDateTime(p.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
