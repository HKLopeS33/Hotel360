import Link from 'next/link'
import { FOOTER_LINKS, CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from '@/lib/footer-links'

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-center md:items-end gap-1 text-center md:text-right">
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white transition-colors">
            {CONTACT_EMAIL}
          </a>
          <a href={`tel:${CONTACT_PHONE_TEL}`} className="hover:text-white transition-colors">
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Hotel360. Todos os direitos reservados.
      </div>
    </footer>
  )
}
