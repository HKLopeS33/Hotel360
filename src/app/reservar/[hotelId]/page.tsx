import { createServerClient } from '@supabase/ssr'
import Image from 'next/image'
import { ReservaForm } from './reserva-form'

/** Cliente com service role — bypass de RLS para leitura pública do nome do hotel */
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export default async function ReservarPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params
  const supabase = createAdminClient()

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, nome, online_valor_diaria, online_valor_extra_pet, online_valor_extra_cafe, online_valor_extra_garagem, online_valor_extra_veiculo, politica_agendamento, politica_pagamento, politica_cancelamento, mp_public_key, beta_tester')
    .eq('id', hotelId)
    .single()

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">Link inválido</h1>
          <p className="text-slate-500 mt-2">Este link de reserva não está disponível.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="rounded-lg shrink-0 overflow-hidden h-9 w-9 relative">
            <Image src="/icons/icon-64.png" alt="Hotel360" fill sizes="36px" className="object-contain" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">{hotel.nome}</p>
            <p className="text-xs text-slate-500">Solicitação de Reserva Online</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <ReservaForm
          hotelId={hotel.id}
          hotelNome={hotel.nome}
          pricing={{
            online_valor_diaria: hotel.online_valor_diaria,
            online_valor_extra_pet: hotel.online_valor_extra_pet ?? 0,
            online_valor_extra_cafe: hotel.online_valor_extra_cafe ?? 0,
            online_valor_extra_garagem: hotel.online_valor_extra_garagem ?? 0,
            online_valor_extra_veiculo: hotel.online_valor_extra_veiculo ?? 0,
          }}
          policies={{
            politica_agendamento: hotel.politica_agendamento ?? null,
            politica_pagamento: hotel.politica_pagamento ?? null,
            politica_cancelamento: hotel.politica_cancelamento ?? null,
          }}
          mpPublicKey={hotel.mp_public_key ?? null}
          betaFeatures={hotel.beta_tester ?? false}
        />
      </main>
    </div>
  )
}
