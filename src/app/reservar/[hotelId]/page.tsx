import { createServerClient } from '@supabase/ssr'
import { ReservaForm } from './reserva-form'
import { ReservaPageLayout } from './reserva-page-layout'

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
    .select('id, nome, online_valor_diaria, online_valor_extra_pet, online_valor_extra_cafe, online_valor_extra_garagem, online_valor_extra_veiculo, online_quartos_fotos, online_quartos_precos, online_logo_url, online_imagem_capa_url, online_cor_primaria, online_descricao, online_template, online_fotos_galeria, politica_agendamento, politica_pagamento, politica_cancelamento, mp_public_key, beta_tester')
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
    <ReservaPageLayout
      hotelNome={hotel.nome}
      logoUrl={hotel.online_logo_url ?? null}
      capaUrl={hotel.online_imagem_capa_url ?? null}
      corPrimaria={hotel.online_cor_primaria ?? null}
      descricao={hotel.online_descricao ?? null}
      galeria={hotel.online_fotos_galeria ?? []}
      template={hotel.online_template ?? 'classico'}
    >
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
        quartosFotos={hotel.online_quartos_fotos ?? {}}
        quartosPrecos={hotel.online_quartos_precos ?? {}}
        betaFeatures={hotel.beta_tester ?? false}
      />
    </ReservaPageLayout>
  )
}
