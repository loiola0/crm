import { useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { ArrowRight, Bot, MessageCircleMore, Workflow } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { loginWithPassword } = useAuth()
  const [email, setEmail] = useState('master@focarlab.local')
  const [password, setPassword] = useState('ChangeMe123!')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await loginWithPassword({ email, password })
      toast.success('Bem-vindo ao Focar Lab CRM.')
    } catch {
      toast.error('Falha na autenticacao. Revise as credenciais e a API.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(242,106,46,0.22),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_30%),linear-gradient(180deg,_#fff7ec_0%,_#f8f5ef_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.5rem] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)] md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-300">Focar Lab</p>
          <h1 className="mt-6 max-w-xl font-heading text-5xl font-semibold leading-tight">
            Um CRM feito para times educacionais que querem vender melhor e automatizar com clareza.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
            Centralize leads, faturamento, conversas, matriculas, automacoes no n8n, webhooks do WhatsApp e acompanhamento com IA em um unico painel pronto para producao.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <FeatureCard icon={<MessageCircleMore className="h-5 w-5" />} title="Pronto para WhatsApp" description="Historico de conversa e estrutura de webhook conectados ao modelo central." />
            <FeatureCard icon={<Workflow className="h-5 w-5" />} title="Nativo para n8n" description="Criacao de leads, mudancas de etapa e automacoes preparados para receber fluxos." />
            <FeatureCard icon={<Bot className="h-5 w-5" />} title="Copilotos de IA" description="Preveja respostas comerciais a partir da timeline do CRM." />
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[2.5rem] border border-white/80 bg-white/85 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.09)] backdrop-blur">
          <div className="w-full max-w-md">
            <p className="eyebrow">Login seguro</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">Acesse a central de operacoes</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Use a conta master inicial para o primeiro acesso. Depois disso, crie seus usuarios definitivos e troque os segredos do ambiente.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">E-mail</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="input-field" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Senha</span>
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="input-field" />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar no CRM'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureCard({
  description,
  icon,
  title,
}: {
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <div className="inline-flex rounded-2xl bg-white/10 p-3 text-orange-200">{icon}</div>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  )
}
