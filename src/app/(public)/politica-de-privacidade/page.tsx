import type { Metadata } from 'next'
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from '@/lib/footer-links'

export const metadata: Metadata = {
  title: 'Política de Privacidade - Hotel360',
}

export default function PoliticaDePrivacidadePage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Política de Privacidade</h1>
      <p className="text-sm text-slate-500 mb-8">Última atualização: junho de 2026</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Introdução</h2>
          <p>
            Esta Política de Privacidade descreve como o Hotel360 (&quot;nós&quot;, &quot;nosso&quot; ou &quot;plataforma&quot;)
            coleta, usa, armazena e protege as informações de hotéis clientes, seus colaboradores e
            hóspedes, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">2. Dados que coletamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Dados cadastrais de usuários da plataforma (nome, e-mail, cargo/função, hotel vinculado);</li>
            <li>Dados operacionais inseridos pelos hotéis (reservas, check-ins/check-outs, quartos, tarifas);</li>
            <li>Dados de hóspedes necessários à operação hoteleira (nome, documento, contato, datas de estadia);</li>
            <li>Dados técnicos de acesso (registros de login, endereço IP, dispositivo e versão do aplicativo).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">3. Como utilizamos os dados</h2>
          <p>Os dados coletados são utilizados exclusivamente para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Viabilizar o funcionamento da plataforma e suas funcionalidades (gestão de reservas, quartos, limpeza, manutenção e financeiro);</li>
            <li>Autenticar usuários e controlar permissões de acesso por perfil;</li>
            <li>Enviar comunicações operacionais e atualizações do sistema;</li>
            <li>Cumprir obrigações legais e regulatórias aplicáveis ao setor hoteleiro.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Compartilhamento de dados</h2>
          <p>
            Não vendemos nem compartilhamos dados pessoais com terceiros para fins de marketing.
            Os dados podem ser compartilhados apenas com prestadores de serviço estritamente
            necessários à operação da plataforma (ex.: provedores de infraestrutura e autenticação),
            sempre sob obrigações contratuais de confidencialidade e segurança.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Armazenamento e segurança</h2>
          <p>
            Os dados são armazenados em ambientes seguros, com controle de acesso baseado em
            perfil de usuário (RBAC), criptografia em trânsito e boas práticas de proteção contra
            acessos não autorizados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">6. Direitos do titular</h2>
          <p>
            Nos termos da LGPD, o titular dos dados pode solicitar, a qualquer momento, a
            confirmação da existência de tratamento, acesso, correção, anonimização, eliminação
            ou portabilidade de seus dados pessoais, mediante solicitação ao hotel responsável ou
            diretamente ao Hotel360 pelos canais abaixo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">7. Contato</h2>
          <p>
            Em caso de dúvidas sobre esta política ou sobre o tratamento de seus dados, entre em
            contato pelo e-mail{' '}
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
