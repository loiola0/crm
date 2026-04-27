import { DndContext, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { MessageSquareText, MoveRight } from 'lucide-react'
import { leadStatuses } from '../../lib/constants'
import { formatCurrency, formatDateTime } from '../../lib/format'
import { formatLeadSource, formatLeadStatus } from '../../lib/labels'
import type { LeadListItem, LeadStatus } from '../../types/contracts'

export function PipelineBoard({
  leads,
  onMove,
  onOpenLead,
}: {
  leads: LeadListItem[]
  onMove: (leadId: string, nextStatus: LeadStatus) => void
  onOpenLead: (leadId: string) => void
}) {
  function handleDragEnd(event: DragEndEvent) {
    const nextStatus = event.over?.id as LeadStatus | undefined
    const currentStatus = event.active.data.current?.status as LeadStatus | undefined

    if (!nextStatus || !currentStatus || nextStatus === currentStatus) {
      return
    }

    onMove(String(event.active.id), nextStatus)
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 xl:grid-cols-5">
        {leadStatuses.map((status) => (
          <PipelineColumn
            key={status}
            leads={leads.filter((lead) => lead.status === status)}
            onOpenLead={onOpenLead}
            status={status}
          />
        ))}
      </div>
    </DndContext>
  )
}

function PipelineColumn({
  leads,
  onOpenLead,
  status,
}: {
  leads: LeadListItem[]
  onOpenLead: (leadId: string) => void
  status: LeadStatus
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'rounded-[1.75rem] border border-dashed p-4 transition',
        isOver ? 'border-orange-400 bg-orange-50/80' : 'border-slate-200 bg-slate-50/70',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{formatLeadStatus(status)}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{leads.length} leads</p>
        </div>
        <MoveRight className="h-4 w-4 text-slate-300" />
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} onOpenLead={onOpenLead} />
        ))}

        {leads.length === 0 ? (
          <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-6 text-center text-sm text-slate-400">
            Arraste um lead para ca
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DraggableLeadCard({
  lead,
  onOpenLead,
}: {
  lead: LeadListItem
  onOpenLead: (leadId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { status: lead.status },
  })

  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      type="button"
      onClick={() => onOpenLead(lead.id)}
      className={clsx(
        'w-full rounded-2xl border border-white/90 bg-white p-4 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5',
        isDragging && 'opacity-70',
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-950">{lead.fullName}</p>
          <p className="mt-1 text-sm text-slate-500">{lead.courseInterest || lead.company || formatLeadSource(lead.source)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          {lead.score} pts
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        <MessageSquareText className="h-3.5 w-3.5" />
        Atualizado {formatDateTime(lead.updatedAtUtc)}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {lead.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-500">{lead.ownerName || 'Nao atribuido'}</span>
        <span className="font-semibold text-slate-950">{formatCurrency(lead.potentialRevenue)}</span>
      </div>
    </button>
  )
}
