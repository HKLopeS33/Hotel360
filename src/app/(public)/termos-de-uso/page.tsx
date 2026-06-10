import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from '@/lib/footer-links'

export const metadata: Metadata = {
  title: 'Termos de Uso - Hotel360',
}

export default function TermosDeUsoPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Termos de Uso</h1>
      <p className="text-sm text-slate-500 mb-8">Última atualização: junho de 2026</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Aceitação dos termos</h2>
          <p>
            Ao acessar ou utilizar a plataforma Hotel360, o usuário declara ter lido, compreendido
            e aceito os termos e condições descritos neste documento. Caso não concorde com algum
            ponto, o acesso à plataforma não deve ser realizado.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Descrição do serviço</h2>
          <p>
            O Hotel360 é uma plataforma SaaS de gestão hoteleira que oferece funcionalidades de
            controle de reservas, check-in e check-out, gestão de quartos, limpeza, manutenção e
            financeiro, voltada a hotéis, pousadas e redes hoteleiras.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">3. Cadastro e acesso</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>O acesso à plataforma é realizado mediante credenciais individuais (e-mail e senha);</li>
            <li>Cada usuário é responsável por manter a confidencialidade de suas credenciais;</li>
            <li>O nível de acesso (perfil/função) é definido pelo administrador do hotel contratante;</li>
            <li>É proibido o compartilhamento de contas entre colaboradores.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Uso adequado</h2>
          <p>O usuário compromete-se a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Utilizar a plataforma exclusivamente para fins lícitos relacionados à operação hoteleira;</li>
            <li>Não tentar acessar áreas, dados ou funcionalidades fora de seu nível de permissão;</li>
            <li>Não realizar engenharia reversa, cópia ou redistribuição não autorizada do sistema;</li>
            <li>Manter os dados inseridos na plataforma atualizados e corretos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Disponibilidade</h2>
          <p>
            Empregamos esforços razoáveis para manter a plataforma disponível de forma contínua,
            podendo, no entanto, ocorrer interrupções programadas para manutenção ou atualizações,
            das quais buscaremos avisar com antecedência sempre que possível.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">6. Atualizações do sistema</h2>
          <p>
            O aplicativo desktop do Hotel360 pode receber atualizações automáticas para correção
            de falhas, melhorias de desempenho e novas funcionalidades, sem necessidade de ação
            manual por parte do usuário.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">7. Limitação de responsabilidade</h2>
          <p>
            O Hotel360 não se responsabiliza por perdas decorrentes de uso indevido da plataforma,
            inserção incorreta de dados pelos usuários ou indisponibilidade de serviços de
            terceiros utilizados como infraestrutura.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">8. Alterações destes termos</h2>
          <p>
            Estes Termos de Uso podem ser atualizados periodicamente. Alterações relevantes serão
            comunicadas aos hotéis clientes pelos canais habituais de contato.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">9. Contato</h2>
          <p>
            Dúvidas sobre estes termos podem ser enviadas para{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
              {CONTACT_EMAIL}
            </a>{' '}
            ou pelo telefone {CONTACT_PHONE_DISPLAY}.
          </p>
        </section>
      </div>
    </article>
  )
}
