import { ArrowUpRight } from 'lucide-react'

export function MetricCard({
  accent,
  helper,
  label,
  value,
}: {
  accent: string
  helper: string
  label: string
  value: string
}) {
  return (
    <div className="panel overflow-hidden">
      <div className={`mb-5 h-1.5 w-16 rounded-full ${accent}`} />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <h3 className="font-heading text-3xl font-semibold text-slate-950">{value}</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Tempo real
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  )
}
