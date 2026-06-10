import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from '@/lib/footer-links'

export const metadata: Metadata = {
  title: 'Trabalhe Conosco - Hotel360',
}

export default function TrabalheConoscoPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Trabalhe Conosco</h1>
      <p className="text-sm text-slate-500 mb-8">Faça parte do time que está transformando a gestão hoteleira</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <section>
          <p>
            O Hotel360 é uma plataforma em constante evolução, dedicada a tornar a gestão de
            hotéis, pousadas e redes hoteleiras mais simples, ágil e eficiente. Estamos sempre
            abertos a conhecer pessoas talentosas que queiram contribuir com esse propósito.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Áreas de interesse</h2>
          <p>Mesmo sem vagas abertas no momento, recebemos candidaturas espontâneas para as áreas:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Desenvolvimento de software (front-end, back-end e mobile)</li>
            <li>Atendimento e suporte ao cliente</li>
            <li>Vendas e relacionamento com hotéis parceiros</li>
            <li>Operações e implantação de sistemas hoteleiros</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Como se candidatar</h2>
          <p>
            Envie seu currículo e uma breve apresentação para{' '}
            <a href={`mailto:${CONTACT_EMAIL}?subject=Trabalhe Conosco`} className="text-blue-600 hover:underline">
              {CONTACT_EMAIL}
            </a>{' '}
            indicando a área de interesse no assunto do e-mail. Caso prefira, você também pode
            entrar em contato pelo telefone {CONTACT_PHONE_DISPLAY}.
          </p>
        </section>

        <section>
          <p className="text-sm text-slate-500">
            Mantemos os currículos recebidos em nosso banco de talentos e entramos em contato
            assim que surgirem oportunidades compatíveis com o seu perfil.
          </p>
        </section>
      </div>
    </article>
  )
}
