import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, BadgeDollarSign, MessageSquare, NotebookPen, RefreshCw, Sparkles } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AiPreviewCard } from '../components/ai/AiPreviewCard'
import { formatCurrency, formatDateTime } from '../lib/format'
import { formatChannel, formatEnrollmentStatus, formatLeadSource, formatLeadStatus, formatMessageDirection } from '../lib/labels'
import { getSettingsOverview } from '../services/settings'
import { addLeadMessage, addLeadNote, getLeadById, recalculateLeadScore } from '../services/leads'
import type { MessageDirection } from '../types/contracts'

export function LeadDetailPage() {
  const { leadId = '' } = useParams()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [direction, setDirection] = useState<MessageDirection>('Inbound')

  const leadQuery = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => getLeadById(leadId),
    enabled: Boolean(leadId),
  })

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: getSettingsOverview,
  })

  const noteMutation = useMutation({
    mutationFn: () => addLeadNote(leadId, { content: note, isPinned: false }),
    onSuccess: () => {
      toast.success('Nota adicionada.')
      setNote('')
      void queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    },
    onError: () => toast.error('Nao foi possivel salvar a nota.'),
  })

  const messageMutation = useMutation({
    mutationFn: () => addLeadMessage(leadId, { channel: 'whatsapp', content: message, direction }),
    onSuccess: () => {
      toast.success('Mensagem registrada.')
      setMessage('')
      void queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    },
    onError: () => toast.error('Nao foi possivel salvar a mensagem.'),
  })

  const scoreMutation = useMutation({
    mutationFn: () => recalculateLeadScore(leadId),
    onSuccess: () => {
      toast.success('Score do lead recalculado.')
      void queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: () => toast.error('Falha ao recalcular o score.'),
  })

  if (leadQuery.isLoading) {
    return <div className="panel text-sm text-slate-500">Carregando detalhes do lead...</div>
  }

  const lead = leadQuery.data

  if (!lead) {
    return <div className="panel text-sm text-slate-500">Lead nao encontrado.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/leads" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Voltar para leads
          </Link>
          <h2 className="mt-4 font-heading text-3xl font-semibold text-slate-950">{lead.fullName}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {lead.email || lead.phone} | {formatLeadSource(lead.source)} | responsavel {lead.ownerName || 'nao atribuido'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => scoreMutation.mutate()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <RefreshCw className="h-4 w-4" />
          Recalcular score
        </button>
      </div>

      <section className="grid gap-4 xl:grid-cols-4">
        <DetailStat label="Etapa" value={formatLeadStatus(lead.status)} icon={<Sparkles className="h-4 w-4" />} />
        <DetailStat label="Score do lead" value={`${lead.score} pts`} icon={<NotebookPen className="h-4 w-4" />} />
        <DetailStat label="Engajamento" value={`${lead.engagementScore} pts`} icon={<MessageSquare className="h-4 w-4" />} />
        <DetailStat label="Receita potencial" value={formatCurrency(lead.potentialRevenue)} icon={<BadgeDollarSign className="h-4 w-4" />} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="panel">
            <p className="eyebrow">Perfil</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Contexto comercial</h3>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoCard label="Empresa" value={lead.company || 'Nao informado'} />
              <InfoCard label="Interesse em curso" value={lead.courseInterest || 'Nao informado'} />
              <InfoCard label="Ajuste manual de score" value={String(lead.manualScoreAdjustment)} />
              <InfoCard label="Receita fechada" value={lead.closedRevenue ? formatCurrency(lead.closedRevenue) : 'Nao informado'} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {lead.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Notas</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Contexto interno</h3>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {lead.notes.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.content}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">{formatDateTime(item.createdAtUtc)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Adicione contexto, objecoes ou lembretes de proximo passo."
                className="input-field"
              />
              <button
                type="button"
                onClick={() => noteMutation.mutate()}
                disabled={noteMutation.isPending}
                className="mt-3 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Salvar nota
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel">
            <p className="eyebrow">Conversa</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Historico de mensagens</h3>

            <div className="mt-6 space-y-3">
              {lead.messages.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[1.5rem] px-4 py-4 text-sm leading-7 ${
                    item.direction === 'Outbound'
                      ? 'ml-6 bg-slate-950 text-white'
                      : 'mr-6 border border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <p>{item.content}</p>
                  <p className={`mt-3 text-xs uppercase tracking-[0.25em] ${item.direction === 'Outbound' ? 'text-slate-300' : 'text-slate-400'}`}>
                    {formatChannel(item.channel)} | {formatMessageDirection(item.direction)} | {formatDateTime(item.sentAtUtc)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <select value={direction} onChange={(event) => setDirection(event.target.value as MessageDirection)} className="input-field">
                <option value="Inbound">Entrada</option>
                <option value="Outbound">Saida</option>
              </select>
              <textarea
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Registre aqui a proxima interacao no WhatsApp."
                className="input-field"
              />
              <button
                type="button"
                onClick={() => messageMutation.mutate()}
                disabled={messageMutation.isPending}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Salvar mensagem
              </button>
            </div>
          </div>

          <AiPreviewCard leadId={lead.id} promptTemplates={settingsQuery.data?.promptTemplates ?? []} />

          <div className="panel">
            <p className="eyebrow">Jornada do aluno</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Matriculas</h3>

            <div className="mt-6 space-y-3">
              {lead.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="font-semibold text-slate-950">{enrollment.courseName}</p>
                  <p className="mt-1 text-sm text-slate-500">{enrollment.classTitle || 'Nenhuma turma vinculada'}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{formatEnrollmentStatus(enrollment.status)}</span>
                    <span className="font-semibold text-slate-950">{formatCurrency(enrollment.amountPaid)}</span>
                  </div>
                </div>
              ))}

              {lead.enrollments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  Nenhuma matricula registrada ainda.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function DetailStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="panel">
      <div className="inline-flex rounded-2xl bg-orange-100 p-3 text-orange-600">{icon}</div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
