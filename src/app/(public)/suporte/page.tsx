import type { Metadata } from 'next'
import { Mail, Phone } from 'lucide-react'
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from '@/lib/footer-links'

export const metadata: Metadata = {
  title: 'Ajuda e Suporte - Hotel360',
}

const FAQ = [
  {
    question: 'Esqueci minha senha, como faço para recuperá-la?',
    answer:
      'Solicite ao administrador do seu hotel para redefinir sua senha pelo painel de Usuários. Caso seja o administrador, entre em contato com o suporte do Hotel360 pelos canais abaixo.',
  },
  {
    question: 'Quem pode criar novos usuários e definir permissões?',
    answer:
      'Apenas usuários com perfil de administrador (master/admin) podem criar novos colaboradores e definir seus níveis de acesso (recepção, camareira, manutenção, etc.).',
  },
  {
    question: 'O aplicativo desktop atualiza automaticamente?',
    answer:
      'Sim. O Hotel360 verifica periodicamente por novas versões e baixa as atualizações automaticamente, solicitando apenas a confirmação para reiniciar e aplicar.',
  },
  {
    question: 'Como reporto um problema técnico ou sugiro uma melhoria?',
    answer:
      'Envie uma descrição detalhada do problema ou sugestão para nosso e-mail de suporte. Sempre que possível, inclua prints de tela e os passos para reproduzir o ocorrido.',
  },
]

export default function SuportePage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Ajuda e Suporte</h1>
      <p className="text-sm text-slate-500 mb-8">
        Estamos aqui para ajudar. Confira as perguntas frequentes ou fale diretamente com nossa equipe.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="p-2 bg-blue-50 rounded-lg">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">E-mail</p>
            <p className="text-sm text-slate-500">{CONTACT_EMAIL}</p>
          </div>
        </a>

        <a
          href={`tel:${CONTACT_PHONE_TEL}`}
          className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="p-2 bg-blue-50 rounded-lg">
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Telefone</p>
            <p className="text-sm text-slate-500">{CONTACT_PHONE_DISPLAY}</p>
          </div>
        </a>
      </div>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Perguntas frequentes</h2>
          <div className="space-y-5">
            {FAQ.map((item) => (
              <div key={item.question}>
                <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
                <p className="text-slate-600 mt-1">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  )
}
