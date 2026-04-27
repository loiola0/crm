import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { leadSources } from '../../lib/constants'
import { formatLeadSource } from '../../lib/labels'
import type { CreateLeadRequest, LeadSource } from '../../types/contracts'

const initialForm: CreateLeadRequest = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  courseInterest: '',
  source: 'Manual',
  potentialRevenue: 0,
  closedRevenue: null,
  manualScoreAdjustment: 0,
  ownerUserId: null,
  tags: [],
  initialNote: '',
}

export function LeadFormDrawer({
  isOpen,
  isSaving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: CreateLeadRequest) => Promise<void>
}) {
  const [form, setForm] = useState<CreateLeadRequest>(initialForm)
  const [tagInput, setTagInput] = useState('')

  if (!isOpen) {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await onSubmit({
      ...form,
      tags: tagInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })

    setForm(initialForm)
    setTagInput('')
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-white/60 bg-white px-6 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Novo lead</p>
            <h3 className="mt-3 font-heading text-2xl font-semibold text-slate-950">Criar registro no pipeline</h3>
            <p className="mt-2 text-sm text-slate-500">Capture origem, potencial de receita, tags e nota inicial em um unico fluxo.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Nome completo">
            <input
              required
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              className="input-field"
            />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="E-mail">
              <input
                type="email"
                value={form.email ?? ''}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="input-field"
              />
            </FormField>

            <FormField label="Telefone">
              <input
                required
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="input-field"
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Empresa">
              <input
                value={form.company ?? ''}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                className="input-field"
              />
            </FormField>

            <FormField label="Interesse em curso">
              <input
                value={form.courseInterest ?? ''}
                onChange={(event) => setForm({ ...form, courseInterest: event.target.value })}
                className="input-field"
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Origem">
              <select
                value={form.source}
                onChange={(event) => setForm({ ...form, source: event.target.value as LeadSource })}
                className="input-field"
              >
                {leadSources.map((source) => (
                  <option key={source} value={source}>
                    {formatLeadSource(source)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Receita potencial">
              <input
                type="number"
                min="0"
                value={form.potentialRevenue}
                onChange={(event) => setForm({ ...form, potentialRevenue: Number(event.target.value) })}
                className="input-field"
              />
            </FormField>

            <FormField label="Score manual">
              <input
                type="number"
                value={form.manualScoreAdjustment}
                onChange={(event) => setForm({ ...form, manualScoreAdjustment: Number(event.target.value) })}
                className="input-field"
              />
            </FormField>
          </div>

          <FormField label="Tags">
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="vip, scholarship, urgent"
              className="input-field"
            />
          </FormField>

          <FormField label="Nota inicial">
            <textarea
              rows={5}
              value={form.initialNote ?? ''}
              onChange={(event) => setForm({ ...form, initialNote: event.target.value })}
              className="input-field"
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? 'Salvando...' : 'Criar lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  )
}
