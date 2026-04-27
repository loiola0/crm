import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { LeadFormDrawer } from '../components/leads/LeadFormDrawer'
import { PipelineBoard } from '../components/leads/PipelineBoard'
import { MetricCard } from '../components/ui/MetricCard'
import { leadStatuses } from '../lib/constants'
import { formatCompactNumber, formatCurrency, formatDateTime } from '../lib/format'
import { formatLeadSource, formatLeadStatus } from '../lib/labels'
import { createLead, getLeads, updateLeadStatus } from '../services/leads'
import type { LeadStatus } from '../types/contracts'
import { useNavigate } from 'react-router-dom'

export function LeadsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<LeadStatus | ''>('')
  const deferredSearch = useDeferredValue(search)

  const leadsQuery = useQuery({
    queryKey: ['leads', deferredSearch, status],
    queryFn: () =>
      getLeads({
        search: deferredSearch || undefined,
        status: status || undefined,
        page: 1,
        pageSize: 80,
      }),
  })

  const createLeadMutation = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      toast.success('Lead criado com sucesso.')
      setIsDrawerOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => {
      toast.error('Nao foi possivel criar o lead.')
    },
  })

  const moveLeadMutation = useMutation({
    mutationFn: ({ leadId, nextStatus }: { leadId: string; nextStatus: LeadStatus }) =>
      updateLeadStatus(leadId, { status: nextStatus }),
    onSuccess: () => {
      toast.success('Lead movido no pipeline.')
      void queryClient.invalidateQueries({ queryKey: ['leads'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => {
      toast.error('Falha ao mover o lead no pipeline.')
    },
  })

  const leads = leadsQuery.data?.items ?? []
  const qualifiedLeads = leads.filter((lead) => lead.status === 'Qualified' || lead.status === 'Converted')
  const pipelineValue = leads.reduce((total, lead) => total + lead.potentialRevenue, 0)

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="eyebrow">Operacao comercial</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-slate-950">Pipeline kanban e cadastro de leads</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            Arraste leads entre etapas, crie novos registros e mantenha o historico comercial centralizado para WhatsApp e automacoes no n8n.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Novo lead
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard accent="bg-orange-500" label="Leads visiveis" value={String(leads.length)} helper="Registros que combinam com os filtros ativos." />
        <MetricCard accent="bg-emerald-500" label="Qualificados ou convertidos" value={String(qualifiedLeads.length)} helper="Segmento mais quente para fechamento e onboarding." />
        <MetricCard accent="bg-sky-500" label="Valor do pipeline" value={formatCurrency(pipelineValue)} helper="Oportunidade potencial somada nesses leads." />
        <MetricCard accent="bg-slate-950" label="Score medio" value={formatCompactNumber(Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / Math.max(leads.length, 1)))} helper="Combinacao das regras manuais e automaticas de score." />
      </section>

      <section className="panel">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Busque por nome, telefone, e-mail ou empresa"
              className="input-field pl-11"
            />
          </label>

          <label className="relative block">
            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as LeadStatus | '')}
              className="input-field pl-11"
            >
              <option value="">Todos os status</option>
              {leadStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatLeadStatus(item)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section>
        {leadsQuery.isLoading ? (
          <div className="panel text-sm text-slate-500">Carregando leads...</div>
        ) : (
          <PipelineBoard
            leads={leads}
            onMove={(leadId, nextStatus) => moveLeadMutation.mutate({ leadId, nextStatus })}
            onOpenLead={(leadId) => navigate(`/leads/${leadId}`)}
          />
        )}
      </section>

      <section className="panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Lista de leads</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Registros detalhados</h3>
          </div>
          <p className="text-sm text-slate-500">{leadsQuery.data?.totalItems ?? 0} leads no total</p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.25em] text-slate-400">
              <tr>
                <th className="pb-3">Lead</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Origem</th>
                <th className="pb-3">Receita</th>
                <th className="pb-3">Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="cursor-pointer transition hover:bg-slate-50"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  <td className="py-4">
                    <p className="font-semibold text-slate-950">{lead.fullName}</p>
                    <p className="mt-1 text-slate-500">{lead.email || lead.phone}</p>
                  </td>
                  <td className="py-4 text-slate-700">{formatLeadStatus(lead.status)}</td>
                  <td className="py-4 text-slate-700">{formatLeadSource(lead.source)}</td>
                  <td className="py-4 font-semibold text-slate-950">{formatCurrency(lead.potentialRevenue)}</td>
                  <td className="py-4 text-slate-500">{formatDateTime(lead.updatedAtUtc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <LeadFormDrawer
        isOpen={isDrawerOpen}
        isSaving={createLeadMutation.isPending}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={async (payload) => {
          await createLeadMutation.mutateAsync(payload)
        }}
      />
    </div>
  )
}
