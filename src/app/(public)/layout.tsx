import Image from 'next/image'
import Link from 'next/link'
import { SiteFooter } from '@/components/layout/site-footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/login" className="relative h-10 w-36 block">
            <Image src="/logo.png" alt="Hotel360" fill className="object-contain" priority />
          </Link>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Voltar ao login
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        {children}
      </main>

      <SiteFooter />
    </div>
  )
}
