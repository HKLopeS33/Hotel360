'use client'

import { useEffect, useState } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { Loader2 } from 'lucide-react'

interface PaymentBrickProps {
  publicKey: string
  amount: number
  payerEmail?: string
  reservationId: string
  hotelId: string
  onResult: (result: { status: string; status_detail?: string; error?: string }) => void
}

export function PaymentBrick({ publicKey, amount, payerEmail, reservationId, hotelId, onResult }: PaymentBrickProps) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initMercadoPago(publicKey, { locale: 'pt-BR' })
  }, [publicKey])

  return (
    <div className="space-y-2">
      {!ready && (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando pagamento...
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Payment
        initialization={{
          amount,
          payer: { email: payerEmail || undefined },
        }}
        customization={{
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            bankTransfer: 'all',
          },
        }}
        onReady={() => setReady(true)}
        onError={(err) => setError(err?.message ?? 'Erro ao carregar formulário de pagamento')}
        onSubmit={async ({ formData }) => {
          setError(null)
          try {
            const res = await fetch('/api/mercadopago/process-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reservationId, hotelId, formData }),
            })
            const data = await res.json()
            if (!res.ok) {
              setError(data.error ?? 'Erro ao processar pagamento')
              onResult({ status: 'error', error: data.error })
              return
            }
            onResult({ status: data.status, status_detail: data.status_detail })
          } catch {
            setError('Erro ao processar pagamento')
            onResult({ status: 'error', error: 'Erro ao processar pagamento' })
          }
        }}
      />
    </div>
  )
}
