import { useQuery } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MetricCard } from '../components/ui/MetricCard'
import { formatCurrency } from '../lib/format'
import { formatLeadSource, formatLeadStatus, formatTimelineType } from '../lib/labels'
import { getDashboardOverview } from '../services/dashboard'

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardOverview,
  })

  if (dashboardQuery.isLoading) {
    return <LoadingState message="Carregando metricas do painel..." />
  }

  const dashboard = dashboardQuery.data

  if (!dashboard) {
    return <LoadingState message="Os dados do painel nao estao disponiveis." />
  }

  const localizedFunnel = dashboard.funnel.map((stage) => ({
    ...stage,
    statusLabel: formatLeadStatus(stage.status),
  }))

  const localizedSources = dashboard.sourceBreakdown.map((item) => ({
    ...item,
    sourceLabel: formatLeadSource(item.source),
  }))

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard accent="bg-orange-500" label="Leads hoje" value={String(dashboard.metrics.today)} helper="Captacao fresca em todos os canais ativos." />
        <MetricCard accent="bg-sky-500" label="Leads na semana" value={String(dashboard.metrics.thisWeek)} helper="Um sinal direto do ritmo comercial e da demanda." />
        <MetricCard accent="bg-emerald-500" label="Taxa de conversao" value={`${dashboard.conversionRate}%`} helper="Performance do funil entre leads qualificados e convertidos." />
        <MetricCard accent="bg-slate-950" label="Faturamento do mes" value={formatCurrency(dashboard.revenueThisMonth)} helper="Receita fechada em vendas e matriculas convertidas." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="panel">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Velocidade de leads</p>
              <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Tendencia diaria de aquisicao</h3>
            </div>
            <p className="text-sm text-slate-500">Ultimos 14 dias</p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.leadTrend}>
                <defs>
                  <linearGradient id="leadTrendFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f26a2e" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#f26a2e" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#f26a2e" strokeWidth={3} fill="url(#leadTrendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">Faturamento</p>
          <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Resumo do momento</h3>
          <p className="mt-3 text-sm text-slate-500">Saude atual da operacao para comercial e admissoes.</p>

          <div className="mt-8 space-y-4">
            <KpiRow label="Leads abertos" value={String(dashboard.metrics.totalOpenLeads)} />
            <KpiRow label="Faturamento total" value={formatCurrency(dashboard.revenueTotal)} />
            <KpiRow label="Faturamento mensal" value={formatCurrency(dashboard.revenueThisMonth)} />
          </div>

          <div className="mt-8 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.revenueTrend}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1.2fr]">
        <div className="panel">
          <p className="eyebrow">Funil</p>
          <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Distribuicao do pipeline</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={localizedFunnel}>
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="statusLabel" tick={{ fill: '#64748b', fontSize: 12 }} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#f26a2e" radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">Origens</p>
          <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Mix de aquisicao</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={localizedSources}
                  dataKey="count"
                  nameKey="sourceLabel"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={4}
                  fill="#0f172a"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">Atividade</p>
          <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Timeline recente</h3>
          <div className="mt-6 space-y-4">
            {dashboard.activityTimeline.map((event) => (
              <div key={event.id} className="flex gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4">
                <div className="mt-1 rounded-full bg-orange-100 p-2 text-orange-600">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{event.description}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{formatTimelineType(event.type)}</p>
                  <p className="mt-2 text-sm text-slate-500">{new Date(event.happenedAtUtc).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function LoadingState({ message }: { message: string }) {
  return <div className="panel text-sm text-slate-500">{message}</div>
}

function KpiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-heading text-xl font-semibold text-slate-950">{value}</span>
    </div>
  )
}
