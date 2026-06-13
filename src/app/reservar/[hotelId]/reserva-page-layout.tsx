import Image from 'next/image'
import { PhotoCarousel } from '@/components/photo-carousel'

interface ReservaPageLayoutProps {
  hotelNome: string
  logoUrl: string | null
  capaUrl: string | null
  corPrimaria: string | null
  descricao: string | null
  galeria: string[]
  template: string
  children: React.ReactNode
}

export function ReservaPageLayout({ hotelNome, logoUrl, capaUrl, corPrimaria, descricao, galeria, template, children }: ReservaPageLayoutProps) {
  const style = { '--brand': corPrimaria || '#2563eb' } as React.CSSProperties

  if (template === 'moderno') {
    return (
      <div style={style} className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <div className="relative h-12 w-12 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-white">
                  <Image src={logoUrl} alt={hotelNome} fill sizes="48px" className="object-cover" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-slate-900">{hotelNome}</h1>
            </div>
            {capaUrl && (
              <div className="relative h-56 rounded-2xl overflow-hidden">
                <Image src={capaUrl} alt="" fill sizes="600px" className="object-cover" />
              </div>
            )}
            {descricao && <p className="text-slate-600 whitespace-pre-line">{descricao}</p>}
            {galeria.length > 0 && <PhotoCarousel photos={galeria} />}
          </div>
          <div>{children}</div>
        </div>
      </div>
    )
  }

  if (template === 'minimalista') {
    return (
      <div style={style} className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            {logoUrl ? (
              <div className="relative h-9 w-9 rounded-lg overflow-hidden shrink-0 bg-white">
                <Image src={logoUrl} alt={hotelNome} fill sizes="36px" className="object-cover" />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-lg shrink-0" style={{ background: 'var(--brand)' }} />
            )}
            <div>
              <p className="font-bold text-slate-900 leading-tight">{hotelNome}</p>
              <p className="text-xs text-slate-500">Solicitação de Reserva Online</p>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          {descricao && <p className="text-sm text-slate-600 whitespace-pre-line">{descricao}</p>}
          {galeria.length > 0 && <PhotoCarousel photos={galeria} />}
          {children}
        </main>
      </div>
    )
  }

  // classico (padrão)
  return (
    <div style={style} className="min-h-screen bg-slate-50">
      {capaUrl ? (
        <div className="relative h-48 sm:h-64 w-full">
          <Image src={capaUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ) : (
        <div className="h-24 w-full" style={{ background: 'var(--brand)' }} />
      )}

      <div className="max-w-2xl mx-auto px-4 -mt-10 relative">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          {logoUrl && (
            <div className="relative h-14 w-14 rounded-full overflow-hidden border border-slate-200 shrink-0 -mt-8 bg-white">
              <Image src={logoUrl} alt={hotelNome} fill sizes="56px" className="object-cover" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-slate-900">{hotelNome}</h1>
            <p className="text-xs text-slate-500">Solicitação de Reserva Online</p>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {descricao && <p className="text-sm text-slate-600 whitespace-pre-line">{descricao}</p>}
        {galeria.length > 0 && <PhotoCarousel photos={galeria} />}
        {children}
      </main>
    </div>
  )
}
